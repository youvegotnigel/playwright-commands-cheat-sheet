# 🎭 VitalHub Playwright Commands Cheat Sheet

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20Dashboard-0a7cff?style=for-the-badge)](https://youvegotnigel.github.io/playwright-commands-cheat-sheet/)
[![Playwright Version](https://img.shields.io/badge/Playwright-1.61.0-2EAD33?style=for-the-badge&logo=playwright)](https://playwright.dev/)

An interactive browser-based reference for Playwright users who want to quickly browse commands, examples, and official docs links in one place.

![Dashboard](images/dashboard.jpeg)
*Grid view -> browse all commands by category and difficulty*

![Command modal](images/description.jpg)
*Command modal -> description, code snippet, copy button, and docs link*

## Features
- Difficulty levels: Beginner, Intermediate, and Advanced
- Category filter tabs
- Flat and Grouped view modes
- Search across name, description, tip, and code
- Copy-to-clipboard on every snippet
- Direct links to official Playwright docs

## Categories
Config, Setup, Query, Action, Assertions, Utility, API, Patterns, CLI, Accessibility

## How to Use
1. Open [playwright commands cheat sheet](https://youvegotnigel.github.io/playwright-commands-cheat-sheet/) in your browser
2. Use **⭐ Start Here** to see beginner commands if you are new to Playwright
3. Click any tile to see the full description, code example, and tip
4. Use the **search bar** to find commands by name, description, or keyword
5. Use the **category filter tabs** to focus on one area at a time
6. Toggle **Grouped** view to see commands organised under their category headers
7. Click **Docs ↗** in the modal to open the official Playwright documentation

## Project Structure
```text
playwright-commands-cheat-sheet/
├── images/
│   ├── dashboard.jpeg
│   └── description.jpg
├── js/
│   ├── app.js
│   └── data/
│       ├── index.js        # imports each category and exports `categories`
│       ├── config.js
│       ├── setup.js
│       ├── actions.js
│       ├── queries.js
│       ├── assertions.js
│       ├── utility.js
│       ├── api.js
│       ├── accessibility.js
│       ├── patterns.js
│       └── cli.js
├── tests/
│   ├── cheatsheet.spec.js
│   └── data-integrity.spec.js
├── index.html
├── playwright.config.js
├── style.css
├── package.json
├── LICENSE
└── README.md
```

## Contributing
### Adding a New Command
Open the relevant category file in [js/data/](js/data/) (e.g. [js/data/queries.js](js/data/queries.js) for a locator, [js/data/cli.js](js/data/cli.js) for a CLI flag), and add a new object to its `items` array:

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
Create a new file in [js/data/](js/data/) (e.g. `js/data/network.js`) that default-exports the category object:

```javascript
/** @type {import('./index.js').Category} */
export default {
  cat:   'CategoryName',
  cls:   'category-css-class',
  color: '#hexcolor',
  items: [ /* commands go here */ ]
};
```

Then register it in [js/data/index.js](js/data/index.js) by importing the file and adding it to the `categories` array.

Finally, add the corresponding CSS class in [style.css](style.css):

```css
.category-css-class {
  background: linear-gradient(135deg, #color1, #color2);
}
```

## Author
* **Nigel Mulholland** - [Linkedin](https://www.linkedin.com/in/nigel-mulholland/)
