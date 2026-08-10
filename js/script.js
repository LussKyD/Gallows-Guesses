/* ===================================================================
   Gallows & Guesses — game logic
   =================================================================== */

const CATEGORIES = {
  tech: {
    name: "Tech",
    icon: "💻",
    words: ["python", "developer", "computer", "hangman", "programming", "variable", "function", "keyboard", "algorithm", "database"]
  },
  animals: {
    name: "Animals",
    icon: "🦊",
    words: ["elephant", "penguin", "giraffe", "octopus", "dolphin", "kangaroo", "hedgehog", "flamingo", "chameleon", "otter"]
  },
  movies: {
    name: "Movies",
    icon: "🎬",
    words: ["inception", "gladiator", "jaws", "avatar", "frozen", "up", "coco", "gravity", "titanic", "moana"]
  }
};

const MAX_WRONG = 6;
const PART_ORDER = ["partHead", "partTorso", "partArmL", "partArmR", "partLegL", "partLegR"];
const QWERTY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

/* ---------- State ---------- */

let state = {
  category: null,
  word: "",
  guessed: new Set(),
  wrong: 0
};

/* ---------- Elements ---------- */

const els = {
  pickerScreen: document.getElementById("pickerScreen"),
  gameScreen: document.getElementById("gameScreen"),
  categoryGrid: document.getElementById("categoryGrid"),
  backBtn: document.getElementById("backBtn"),
  gameHeading: document.getElementById("gameHeading"),
  wordRow: document.getElementById("wordRow"),
  statusMsg: document.getElementById("statusMsg"),
  keyboard: document.getElementById("keyboard"),
  livesRow: document.getElementById("livesRow"),
  wrongLetters: document.getElementById("wrongLetters"),
  playAgainBtn: document.getElementById("playAgainBtn"),
  ropeGroup: document.getElementById("ropeGroup"),
  figure: document.getElementById("figure"),
  face: document.getElementById("faceNeutral"),
  mouth: document.getElementById("mouth"),
  themeToggle: document.getElementById("themeToggle")
};

/* ---------- Category picker ---------- */

function buildCategoryGrid() {
  els.categoryGrid.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const btn = document.createElement("button");
    btn.className = "category-card";
    btn.setAttribute("role", "listitem");
    btn.innerHTML = `
      <span class="category-card__icon">${cat.icon}</span>
      <span class="category-card__name">${cat.name}</span>
      <span class="category-card__count">${cat.words.length} words</span>
    `;
    btn.addEventListener("click", () => startGame(key));
    els.categoryGrid.appendChild(btn);
  });
}

/* ---------- Game setup ---------- */

function startGame(categoryKey) {
  const cat = CATEGORIES[categoryKey];
  const word = cat.words[Math.floor(Math.random() * cat.words.length)];

  state = { category: categoryKey, word, guessed: new Set(), wrong: 0 };

  els.gameHeading.textContent = `${cat.icon} ${cat.name}`;
  els.pickerScreen.hidden = true;
  els.gameScreen.hidden = false;
  els.playAgainBtn.hidden = true;
  els.statusMsg.textContent = "\u00A0";
  els.statusMsg.className = "status-msg";

  resetFigure();
  renderWord();
  renderLives();
  renderWrongLetters();
  buildKeyboard();
}

function resetFigure() {
  PART_ORDER.forEach(id => document.getElementById(id).classList.remove("drawn"));
  els.face.classList.remove("show");
  els.figure.classList.remove("dizzy", "win", "wobble");
  els.mouth.setAttribute("d", "M 182 91 Q 190 91 198 91");
  setFaceEyes("neutral");
}

/* ---------- Rendering ---------- */

function renderWord() {
  els.wordRow.innerHTML = "";
  for (const ch of state.word) {
    if (ch === " ") {
      const gap = document.createElement("span");
      gap.className = "letter-slot space";
      els.wordRow.appendChild(gap);
      continue;
    }
    const slot = document.createElement("span");
    const revealed = state.guessed.has(ch);
    slot.className = "letter-slot" + (revealed ? " filled" : "");
    slot.textContent = revealed ? ch : "";
    els.wordRow.appendChild(slot);
  }
}

function renderLives() {
  const remaining = MAX_WRONG - state.wrong;
  els.livesRow.innerHTML = "";
  for (let i = 0; i < MAX_WRONG; i++) {
    const span = document.createElement("span");
    span.className = "life-icon" + (i < remaining ? "" : " lost");
    span.textContent = "❤️";
    els.livesRow.appendChild(span);
  }
}

function renderWrongLetters() {
  const wrongLetters = [...state.guessed].filter(ch => !state.word.includes(ch)).sort();
  els.wrongLetters.textContent = wrongLetters.length ? wrongLetters.join(", ") : "—";
}

function buildKeyboard() {
  els.keyboard.innerHTML = "";
  QWERTY_ROWS.forEach(row => {
    for (const letter of row) {
      const key = document.createElement("button");
      key.className = "key";
      key.type = "button";
      key.textContent = letter;
      key.dataset.letter = letter;
      key.addEventListener("click", () => handleGuess(letter));
      els.keyboard.appendChild(key);
    }
  });
}

/* ---------- Face states ---------- */

function setFaceEyes(mode) {
  const eyes = els.face.querySelectorAll(".eye");
  if (mode === "dizzy") {
    eyes.forEach(eye => eye.setAttribute("r", "1"));
  } else {
    eyes.forEach(eye => eye.setAttribute("r", "2"));
  }
}

function updateFaceForWrongCount(wrong) {
  els.face.classList.add("show");
  if (wrong <= 2) {
    els.mouth.setAttribute("d", "M 182 91 Q 190 91 198 91"); // neutral
    setFaceEyes("neutral");
  } else if (wrong <= 4) {
    els.mouth.setAttribute("d", "M 182 93 Q 190 88 198 93"); // worried frown
    setFaceEyes("neutral");
  } else if (wrong < MAX_WRONG) {
    els.mouth.setAttribute("d", "M 181 92 Q 190 85 199 92"); // deep frown
    setFaceEyes("dizzy");
  } else {
    els.mouth.setAttribute("d", "M 183 88 L 197 94 M 197 88 L 183 94"); // X mouth (game over)
    setFaceEyes("dizzy");
    els.figure.classList.add("dizzy");
  }
}

function setWinFace() {
  els.mouth.setAttribute("d", "M 181 89 Q 190 97 199 89"); // big smile
  setFaceEyes("neutral");
  els.figure.classList.add("win");
}

/* ---------- Guessing ---------- */

function handleGuess(letter) {
  if (state.guessed.has(letter)) return;
  state.guessed.add(letter);

  const key = els.keyboard.querySelector(`[data-letter="${letter}"]`);

  if (state.word.includes(letter)) {
    key.classList.add("correct");
    key.disabled = true;
    showStatus(`Nice — "${letter}" is in there.`, "good");
    renderWord();
    checkWin();
  } else {
    state.wrong += 1;
    key.classList.add("wrong");
    key.disabled = true;
    showStatus(`"${letter}" isn't in the word.`, "bad");

    revealNextPart();
    creakRope();
    updateFaceForWrongCount(state.wrong);
    renderLives();
    renderWrongLetters();

    checkLoss();
  }
}

function revealNextPart() {
  const partId = PART_ORDER[state.wrong - 1];
  if (!partId) return;
  const el = document.getElementById(partId);
  el.classList.add("drawn");
  els.figure.classList.add("wobble");
  setTimeout(() => els.figure.classList.remove("wobble"), 600);
}

function creakRope() {
  els.ropeGroup.classList.remove("creak");
  // force reflow so the animation can restart
  void els.ropeGroup.offsetWidth;
  els.ropeGroup.classList.add("creak");
}

function showStatus(text, tone) {
  els.statusMsg.textContent = text;
  els.statusMsg.className = "status-msg" + (tone ? ` ${tone}` : "");
}

function checkWin() {
  const isWon = [...state.word].every(ch => ch === " " || state.guessed.has(ch));
  if (!isWon) return;
  showStatus(`🎉 You got it — "${state.word}"!`, "good");
  setWinFace();
  endRound();
}

function checkLoss() {
  if (state.wrong < MAX_WRONG) return;
  showStatus(`💀 Out of guesses — it was "${state.word}".`, "bad");
  endRound();
}

function endRound() {
  document.querySelectorAll(".key").forEach(k => (k.disabled = true));
  els.playAgainBtn.hidden = false;
}

/* ---------- Navigation ---------- */

els.backBtn.addEventListener("click", () => {
  els.gameScreen.hidden = true;
  els.pickerScreen.hidden = false;
});

els.playAgainBtn.addEventListener("click", () => startGame(state.category));

document.addEventListener("keydown", (e) => {
  if (els.gameScreen.hidden) return;
  const letter = e.key.toLowerCase();
  if (letter.length === 1 && letter >= "a" && letter <= "z") {
    const key = els.keyboard.querySelector(`[data-letter="${letter}"]`);
    if (key && !key.disabled) handleGuess(letter);
  }
});

/* ---------- Theme toggle ---------- */

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  els.themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  els.themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

els.themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(prefersDark ? "dark" : "light");

/* ---------- Init ---------- */

buildCategoryGrid();
