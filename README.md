
Gallows & Guesses 

A browser-based Hangman game - pick a category, guess the word, and watch the
gallows react with each
wrong guess. 

File structure

```
.
├── index.html        # entry point (must stay at repo root for GitHub Pages)
├── css/
│   └── style.css      # theme tokens + layout + animations
├── js/
│   └── script.js       # game state, categories, rendering, theme toggle
├── images/
│   └── favicon.svg
└── README.md
```


## Adding your own words

Open `js/script.js` and edit the `CATEGORIES` object — add a new key for a
new category, or extend an existing `words` array. Everything else (grid,
random pick, keyboard) adapts automatically.

## Notes

- No external JS dependencies. Three Google Fonts (`Black Ops One`,
  `Quicksand`, `Space Mono`) are loaded via CDN link in `index.html`.
- Respects `prefers-reduced-motion` and `prefers-color-scheme` on first load.
- Win/loss streaks persist locally via `localStorage` (per browser, no
  account needed). Sound effects are synthesized in-browser with the Web
  Audio API, so there are no audio files to host — mute with the note-icon
  toggle in the header.
