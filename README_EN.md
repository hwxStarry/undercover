[中文](README.md) | English

# Undercover — Online and Offline Party Game

🎴 The home page offers Online and Offline modes. Online rooms now work with the local mozheAdmin service; public deployment is still being prepared. The built-in library has 2,185 word groups across 61 categories and supports 3–10 players.

> 🚀 Live Demo: [undercover.mozhe.cc](https://undercover.mozhe.cc/)

## Features

- **Random Generation**: Each game randomly draws words with automatic spy rotation for fairness
- **Large Word Library**: 2,185 word groups covering fruits, vegetables, animals, electronics, food, clothing, and more across 61 categories
- **Category Filtering**: Select or exclude specific categories to control the word pool
- **Flexible Configuration**: Supports 3–10 players, 30/50/100 words per card, Chinese red dashed / simple black line styles
- **Host Card**: For 4+ players, automatically generates a host card with spy words highlighted
- **Print Preview**: Auto pagination, cards won't be split across pages, supports small/medium/large font sizes
- **Library Editing**: Built-in editor with search, add, edit, and delete; also supports JSON import/export
- **Persistent Storage**: Word library and category selections auto-saved to browser localStorage

## Usage

Offline mode remains a static page that can be opened directly. Online mode requires the mozheAdmin service and an HTTP server for this page. For local testing, run `python3 -m http.server 8099` and open `http://127.0.0.1:8099/#online`. On `undercover.mozhe.cc`, the default API is `https://admin.mozhe.cc/undercover/api/v1`. Other hosted domains use the same-origin `/undercover/api/v1` by default; set `window.UNDERCOVER_API_BASE` before loading `js/online.js` to override it.

Online hosts can make a room public or private. Public rooms appear in the lobby and can be joined without a code; private rooms require a six-character code. Hosts can choose a word category or draw from all categories, and set 1–10 games. Each game has one undercover player among 3–10 players. Players describe in turn, then vote. Ties trigger another vote. Civilians win when the undercover player is eliminated; the undercover player wins at a one-to-one survivor count. After each game, the host starts the next one with new words and a new undercover player.

On the first visit to Online mode, enter a nickname or generate one. Confirmation saves it in this browser for future rooms. Click the displayed nickname to change it; edits made inside a room are shared with the other players. Random names combine locally maintained English or Chinese descriptor and object word lists, with no runtime package dependency.

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

Online inputs, selects, and buttons use a local copy of Bootstrap 5.3.8 CSS (MIT license in `css/vendor/bootstrap-LICENSE.txt`). `css/landing.css` supplies the colors and layout. No Bootstrap JavaScript or external CDN is needed.

Maintain new words in `data/word-families.tsv`, grouped by narrow semantic families. Run `node tools/build-word-expansion.mjs` to regenerate `js/library-expanded.js` and the `mozheAdmin` seed file. Each word receives four nearby words from its family as candidate counterparts. The script rejects empty and duplicate words or invalid pairs. A Chinese lexicon cannot be exhaustive; this collection focuses on pairs people can describe and distinguish during a game. Saved libraries based on the old defaults receive the new groups once, while independently imported libraries remain intact.

### Project Structure

```
├── index.html                  # Current site entry point
├── css/style.css               # Offline card styles
├── css/landing.css             # Home and mode entry styles
├── css/vendor/                 # Bootstrap CSS and license
├── data/word-families.tsv      # Semantic families for the expansion
├── js/
│   ├── library.js              # Word library data
│   ├── library-expanded.js     # Generated word expansion
│   ├── nickname.js             # Chinese and English nickname generator
│   ├── online.js               # Online rooms and nickname flow
│   ├── render.js               # Card rendering and printing
│   ├── edit.js                 # Library editing and import/export
│   ├── i18n.js                 # Language switching
│   ├── navigation.js           # Home, online, and offline navigation
│   ├── locales/                # Chinese and English strings
│   └── main.js                 # Event bindings and initialization
├── tools/build-word-expansion.mjs # Generate the frontend and backend expansion
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
| Ctrl + G | Generate cards in Offline mode |
| Esc | Close modal |

## License

MIT
