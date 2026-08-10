
Gallows & Guesses 🎪

A browser-based Hangman game — pick a category, guess the word, and watch the
gallows react with each wrong guess.

------------------------------------------------------------------------------------

File structure

.
├── index.html        
├── css/
│   └── style.css      
├── js/
│   └── script.js       
├── images/
│   └── favicon.svg
└── README.md

------------------------------------------------------------------------------------

## Adding your own words

Open `js/script.js` and edit the `CATEGORIES` object - add a new key for a
new category, or extend an existing `words` array. Everything else (grid,
random pick, keyboard) adapts automatically.

## Notes

- No external JS dependencies. Two Google Fonts (`Chewy`, `Quicksand`, `Space
  Mono`) are loaded via CDN link in `index.html`.
- Respects `prefers-reduced-motion` and `prefers-color-scheme` on first load.
