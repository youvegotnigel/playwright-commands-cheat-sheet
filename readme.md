# 🎭 VitalHub Playwright Cheat Sheet

An interactive reference dashboard for Playwright test automation, designed for beginners and experienced testers alike. Built with plain HTML, CSS, and JavaScript 

* no build tools or dependencies required.

---

## Features

### Command Tiles
- Every Playwright command is displayed as a clickable tile
- Each tile shows a **difficulty indicator** in the corner:
  - `●` Green — Beginner
  - `●●` Orange — Intermediate
  - `●●●` Purple — Advanced

### Command Modal
Clicking any tile opens a detailed modal containing:
- **Plain-English description** — what the command does, in simple terms
- **Code example** — ready-to-use snippet
- **Difficulty badge** — colour coded level indicator
- **Docs ↗ link** — direct link to the official Playwright documentation page
- **Copy button** — copies the code snippet to clipboard with visual confirmation
- Press **Escape** or click outside the modal to close it

### Filter Tabs
Filter the grid by category using the pill buttons at the top:

| Filter | Description |
|---|---|
| All | Shows every command |
| ⭐ Start Here | Shows beginner-level commands only — the best starting point |
| Setup | Test structure commands |
| Query | Element selector methods |
| Action | User interaction methods |
| Assertions | Expectation and assertion methods |
| Utility | Navigation, debugging, and page utilities |
| API | HTTP request and network interception methods |
| Patterns | Full multi-step test examples |

### View Modes
Toggle between two layouts using the **Flat** / **Grouped** buttons:
- **Flat** — all commands in a single grid (default)
- **Grouped** — commands organised under their category headers

### Search
The search bar filters across:
- Command name
- Plain-English description
- Tip text
- Code content

---

## Categories

### Setup (Cyan)
The building blocks every Playwright test file needs.

| Command | Level |
|---|---|
| `test()` | Beginner |
| `test.describe()` | Beginner |
| `beforeEach()` | Beginner |
| `afterEach()` | Intermediate |
| `beforeAll()` | Intermediate |
| `afterAll()` | Intermediate |
| `expect()` | Beginner |

### Query (Blue)
Methods for finding elements on the page.

| Command | Level |
|---|---|
| `locator()` | Beginner |
| `getByRole()` | Beginner |
| `getByText()` | Beginner |
| `getByLabel()` | Beginner |
| `getByPlaceholder()` | Beginner |
| `getByTestId()` | Beginner |
| `getByAltText()` | Intermediate |
| `getByTitle()` | Intermediate |
| `frameLocator()` | Advanced |
| `nth()` | Intermediate |
| `filter()` | Intermediate |

### Action (Green)
Methods for interacting with elements.

| Command | Level |
|---|---|
| `click()` | Beginner |
| `fill()` | Beginner |
| `press()` | Beginner |
| `check()` | Beginner |
| `uncheck()` | Beginner |
| `selectOption()` | Beginner |
| `clear()` | Beginner |
| `hover()` | Intermediate |
| `dblclick()` | Intermediate |
| `type()` | Intermediate |
| `setInputFiles()` | Intermediate |
| `scrollIntoView()` | Intermediate |
| `keyboard.press()` | Intermediate |
| `dragTo()` | Advanced |

### Assertions (Orange)
Methods for verifying expected state.

| Command | Level |
|---|---|
| `toBeVisible()` | Beginner |
| `toBeHidden()` | Beginner |
| `toHaveText()` | Beginner |
| `toContainText()` | Beginner |
| `toHaveURL()` | Beginner |
| `toHaveTitle()` | Beginner |
| `toBeEnabled()` | Beginner |
| `toBeDisabled()` | Beginner |
| `toBeChecked()` | Intermediate |
| `toHaveValue()` | Intermediate |
| `toHaveCount()` | Intermediate |
| `toHaveAttribute()` | Intermediate |
| `toHaveClass()` | Intermediate |

### Utility (Purple)
Navigation, debugging, and page control methods.

| Command | Level |
|---|---|
| `goto()` | Beginner |
| `reload()` | Beginner |
| `goBack()` | Beginner |
| `goForward()` | Beginner |
| `screenshot()` | Beginner |
| `pause()` | Beginner |
| `waitForTimeout()` | Beginner |
| `waitForSelector()` | Intermediate |
| `waitForLoadState()` | Intermediate |
| `waitForURL()` | Intermediate |
| `on(console)` | Intermediate |
| `evaluate()` | Advanced |
| `addInitScript()` | Advanced |

### API (Red)
HTTP requests and network interception.

| Command | Level |
|---|---|
| `request.get()` | Beginner |
| `request.post()` | Beginner |
| `request.put()` | Intermediate |
| `request.patch()` | Intermediate |
| `request.delete()` | Intermediate |
| `route()` | Intermediate |
| `waitForResponse()` | Intermediate |
| `waitForRequest()` | Intermediate |
| `route.abort()` | Advanced |
| `route.continue()` | Advanced |

### Patterns (Pink)
Complete multi-step test examples showing how commands work together.

| Pattern | Level |
|---|---|
| Login flow | Beginner |
| Form submit | Beginner |
| Wait for API | Intermediate |
| Mock API | Intermediate |
| File upload | Intermediate |
| API login setup | Intermediate |

---

## How to Use

1. Open `https://youvegotnigel.github.io/playwright-commands-cheat-sheet/` in your browser
2. Use **⭐ Start Here** to see beginner commands if you are new to Playwright
3. Click any tile to see the full description, code example, and tip
4. Use the **search bar** to find commands by name, description, or keyword
5. Use the **category filter tabs** to focus on one area at a time
6. Toggle **Grouped** view to see commands organised under their category headers
7. Click **Docs ↗** in the modal to open the official Playwright documentation

---

## Project Structure

```
playwright-commands-cheat-sheet/
├── index.html       # HTML shell — layout and modal structure only
├── style.css        # All CSS styles
├── js/
│   ├── data.js      # All commands, descriptions, tips, and docs links
│   └── app.js       # UI logic — rendering, filtering, modal, search
└── readme.md
```

### Adding a New Command

Open [js/data.js](js/data.js), find the relevant category section, and add a new object to its `items` array:

```javascript
{
  name:  'commandName()',
  level: 'beginner',        // 'beginner' | 'intermediate' | 'advanced'
  desc:  'Plain-English explanation of what it does.',
  tip:   'When to use it, gotchas, or alternatives.',
  docs:  'https://playwright.dev/docs/...',
  code:  `await page.commandName();`
},
```

### Adding a New Category

In [js/data.js](js/data.js), add a new object to the `categories` array:

```javascript
{
  cat:   'CategoryName',
  cls:   'category-css-class',
  color: '#hexcolor',
  items: [ /* commands go here */ ]
},
```

Then add the corresponding CSS class in [style.css](style.css):

```css
.category-css-class {
  background: linear-gradient(135deg, #color1, #color2);
}
```

---

## Tech

- HTML
- CSS
- JavaScript (vanilla, no frameworks or build tools)
