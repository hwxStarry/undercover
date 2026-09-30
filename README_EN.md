[中文](README.md) | English

# Undercover

A party game with printable word cards and online rooms. Offline play works on its own; online rooms require a companion service and are not yet publicly deployed.

[Live site](https://undercover.mozhe.cc/)

## Features

- Generate printable word cards for 3–10 players, with category filters, a host card, and print preview.
- Search and edit the built-in word library, or import and export it as JSON.
- Create public or private online rooms for word assignment, descriptions, and voting.
- Save word-library settings and edits in the current browser.

## Run locally

```bash
python3 -m http.server 8099
```

Open `http://127.0.0.1:8099/` for offline play. Online rooms also require the companion service; self-hosted deployments can set `window.UNDERCOVER_API_BASE` before `js/online.js` loads.

The project uses plain HTML, CSS, and JavaScript with no build step. Maintain additional words in `data/word-families.tsv`, then run `node tools/build-word-expansion.mjs` to regenerate the frontend word data.
