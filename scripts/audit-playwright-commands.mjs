#!/usr/bin/env node
/**
 * Audits the Playwright Commands Cheat Sheet against the latest official docs.
 *
 * Uses Claude (via Anthropic SDK) with Context7 MCP tools to:
 *   1. Fetch up-to-date Playwright documentation
 *   2. Compare it against every command currently in the cheat sheet
 *   3. Identify missing commands, deprecated items, and content that needs updating
 *   4. Open a GitHub issue with the structured findings
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY  — Anthropic API key
 *   GITHUB_TOKEN       — GitHub token with issues:write permission
 *   GITHUB_REPOSITORY  — owner/repo (set automatically in GitHub Actions)
 */

import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../js/data');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readCheatSheetSummary() {
  const files = readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.js') && f !== 'index.js')
    .sort();

  return files
    .map(f => {
      const src = readFileSync(resolve(DATA_DIR, f), 'utf8');
      const names = [...src.matchAll(/name:'([^']+)'/g)].map(m => m[1]);
      const cat = (src.match(/cat:'([^']+)'/) || [])[1] || f;
      return `**${cat}** (${f}): ${names.join(', ')}`;
    })
    .join('\n');
}

async function createGitHubIssue(title, body) {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !token) {
    console.log('No GitHub credentials — printing report to stdout:\n');
    console.log(`# ${title}\n\n${body}`);
    return;
  }

  const [owner, repoName] = repo.split('/');
  const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ title, body }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }

  const issue = await res.json();
  console.log(`Issue created: ${issue.html_url}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is required');

  const today = new Date().toISOString().split('T')[0];
  const cheatSheetSummary = readCheatSheetSummary();

  // Start Context7 MCP server as a subprocess
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@latest'],
    env: { ...process.env },
  });

  const mcpClient = new Client(
    { name: 'playwright-auditor', version: '1.0.0' },
    { capabilities: {} }
  );

  try {
    await mcpClient.connect(transport);
    console.log('Context7 MCP server connected');

    const { tools: mcpTools } = await mcpClient.listTools();

    // Convert MCP tool schema to Anthropic tool format
    const tools = mcpTools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
    }));

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are a Playwright expert auditing the "Playwright Commands Cheat Sheet" project (youvegotnigel.github.io/playwright-commands-cheat-sheet) for completeness and accuracy.

The cheat sheet is a static single-page web app. Commands are stored in vanilla JS data files, one per category. Each item has: name (required), level (beginner/intermediate/advanced, required), desc (required), and optional tip/docs/code fields.

Your job:
1. Use Context7 to fetch the latest Playwright documentation (library ID: /microsoft/playwright.dev)
2. Query several topics: new APIs in recent releases, deprecated items, important missing patterns
3. Compare findings against the current cheat sheet content below
4. Write a structured Markdown report suitable for a GitHub issue

Be specific: include the command name, which category file it belongs in, the Playwright version it was introduced (if known), and why it is useful. Skip internal/rarely-used APIs and language-specific items (Python, Java, C#).`;

    const userPrompt = `Today's date: ${today}

Current cheat sheet commands by category:
${cheatSheetSummary}

Please audit this against the latest Playwright documentation. Use Context7 to look up:
- New commands/APIs added in recent Playwright versions that are missing from the cheat sheet
- Any APIs listed above that have been deprecated, removed, or had their signatures changed
- Important patterns or best practices the cheat sheet is missing
- Any tips or descriptions in the cheat sheet that are now outdated

Format your final report as a GitHub issue body with these sections:
## ✨ New Commands to Add
(name, suggested category file, version added, why it matters)

## ⚠️ Outdated / Deprecated Items
(current cheat sheet entry, what changed, what to update)

## 🔄 Pattern / Tip Updates
(entry that needs refreshed content, what changed)

## 📋 Summary
(1–2 sentences: overall health of the cheat sheet and top priority action)`;

    let messages = [{ role: 'user', content: userPrompt }];
    let finalReport = '';
    const MAX_TURNS = 12;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages,
      });

      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason === 'end_turn') {
        finalReport = response.content
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('');
        break;
      }

      if (response.stop_reason === 'tool_use') {
        const toolResults = [];

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;

          let resultContent;
          try {
            const result = await mcpClient.callTool({
              name: block.name,
              arguments: block.input,
            });
            // MCP content items can be text, image, or resource — flatten to text
            const text = result.content
              .map(c => (c.type === 'text' ? c.text : JSON.stringify(c)))
              .join('\n');
            resultContent = [{ type: 'text', text }];
          } catch (err) {
            resultContent = [{ type: 'text', text: `Tool error: ${err.message}` }];
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: resultContent,
          });
        }

        messages.push({ role: 'user', content: toolResults });
      }
    }

    if (!finalReport) throw new Error('No report generated after max turns');

    const title = `[Playwright Audit] Cheat sheet gap report — ${today}`;
    await createGitHubIssue(title, finalReport);

  } finally {
    await mcpClient.close().catch(() => {});
  }
}

main().catch(err => {
  console.error('Audit failed:', err.message);
  process.exit(1);
});
