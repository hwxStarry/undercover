[中文](README.md) | English

# Undercover Word Card Generator — Printable Party Game Cards, No Install

🎴 A free word card generator for the "Undercover" (谁是卧底) / Spy party game. Pure static web app with 741 semantic word groups across 55 categories. Supports 3–10 players. One-click printable player cards and host cards.

> 🚀 Live Demo: [undercover.mozhe.cc](https://undercover.mozhe.cc/)

## Features

- **Random Generation**: Each game randomly draws words with automatic spy rotation for fairness
- **Large Word Library**: 741 semantic pairs covering fruits, vegetables, animals, electronics, food, clothing, and more across 55 categories
- **Category Filtering**: Select or exclude specific categories to control the word pool
- **Flexible Configuration**: Supports 3–10 players, 30/50/100 words per card, Chinese red dashed / simple black line styles
- **Host Card**: For 4+ players, automatically generates a host card with spy words highlighted
- **Print Preview**: Auto pagination, cards won't be split across pages, supports small/medium/large font sizes
- **Library Editing**: Built-in editor with search, add, edit, and delete; also supports JSON import/export
- **Persistent Storage**: Word library and category selections auto-saved to browser localStorage

## Usage

Pure static page — no dependencies. Just double-click `index.html` to open in your browser.

### Game Rules

1. Choose the number of players (3–10) and words per card
2. Click "Generate" — the system creates one card per player
3. Each card has N-1 identical words and 1 different word (the spy word)
4. For 4+ players, an extra host card is generated with spy words marked
5. Print the cards, distribute to players, and start the game

### Import Library

Click "Import Library" and paste JSON data:

```json
[
  { "base": "apple", "variants": ["banana", "grape", "orange"], "category": "fruit" },
  { "base": "cola", "variants": ["sprite", "fanta"], "category": "beverage" }
]
```

## Development

Pure static page, no build tools. CSS and JS are included via traditional `<link>` / `<script>` tags. Edit code, refresh browser — that's it.

### Project Structure

```
├── index.html                  # Current site entry point
├── css/style.css               # Page styles
├── js/
│   ├── library.js              # Word library data
│   ├── render.js               # Card rendering and printing
│   ├── edit.js                 # Library editing and import/export
│   ├── i18n.js                 # Language switching
│   ├── locales/                # Chinese and English strings
│   └── main.js                 # Event bindings and initialization
├── CNAME                       # Custom domain
├── robots.txt / sitemap.xml    # Search engine entry points
├── baidu_urls.txt              # Baidu URL submission list
├── baidu_verify_*.html         # Baidu verification files; keep at site root
└── google*.html                # Google verification files; keep at site root
```

Keep `index.html`, `css/`, `js/`, and the domain and verification files at the site root when deploying.

### Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + G | Generate cards |
| Esc | Close modal |

## License

MIT
