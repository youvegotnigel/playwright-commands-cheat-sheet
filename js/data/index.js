/**
 * @typedef {{ name: string, level: 'beginner'|'intermediate'|'advanced', desc: string, tip: string, docs: string, code: string }} Item
 * @typedef {{ cat: string, cls: string, color: string, items: Item[] }} Category
 */

import config        from './config.js';
import setup         from './setup.js';
import actions       from './actions.js';
import queries       from './queries.js';
import assertions    from './assertions.js';
import utility       from './utility.js';
import api           from './api.js';
import accessibility from './accessibility.js';
import patterns      from './patterns.js';
import cli           from './cli.js';

/** @type {Category[]} */
export const categories = [
  config,
  setup,
  actions,
  queries,
  assertions,
  utility,
  api,
  accessibility,
  patterns,
  cli,
];
