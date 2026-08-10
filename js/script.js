/* ===================================================================
   Gallows & Guesses — game logic
   =================================================================== */

const CATEGORIES = {
  tech: {
    name: "Tech",
    words: [
      { word: "python", clue: "A snake that also codes" },
      { word: "developer", clue: "Turns coffee into software" },
      { word: "computer", clue: "Sits on your desk, thinks in binary" },
      { word: "hangman", clue: "The game you're playing right now" },
      { word: "programming", clue: "Talking to a machine in its language" },
      { word: "variable", clue: "A box that holds something, and it can change" },
      { word: "function", clue: "Does one job, whenever you call on it" },
      { word: "keyboard", clue: "Where your fingers do the talking" },
      { word: "algorithm", clue: "A recipe with no ingredients" },
      { word: "database", clue: "A very organized warehouse of facts" }
    ]
  },
  animals: {
    name: "Animals",
    words: [
      { word: "elephant", clue: "Never forgets, rarely fits through doors" },
      { word: "penguin", clue: "Wears a tux, can't fly, swims like a torpedo" },
      { word: "giraffe", clue: "Tall order in the savanna" },
      { word: "octopus", clue: "Eight arms, zero bones" },
      { word: "dolphin", clue: "Ocean's class clown" },
      { word: "kangaroo", clue: "Comes with a built-in pocket" },
      { word: "hedgehog", clue: "A pincushion that can walk" },
      { word: "flamingo", clue: "Stands on one leg, dressed in pink" },
      { word: "chameleon", clue: "Matches the room like a good guest" },
      { word: "otter", clue: "Holds hands with friends while napping on water" },
      { word: "mouse", clue: "Small, quick, lives indoors" },
      { word: "moose", clue: "Large, slow, lives in northern forests" }
    ]
  },
  movies: {
    name: "Movies",
    words: [
      { word: "inception", clue: "A dream inside a dream inside a dream" },
      { word: "gladiator", clue: "Are you not entertained?" },
      { word: "jaws", clue: "You're gonna need a bigger boat" },
      { word: "avatar", clue: "Blue people, tall trees, big box office" },
      { word: "frozen", clue: "A cold sister-based sing-along" },
      { word: "up", clue: "A house lifted by balloons" },
      { word: "coco", clue: "A trip to the land of the dead, animated" },
      { word: "gravity", clue: "Stranded above the atmosphere" },
      { word: "titanic", clue: "A ship that famously didn't finish its trip" },
      { word: "moana", clue: "A wayfinder answers the ocean's call" }
    ]
  }
};

const MAX_WRONG = 6;
const PART_ORDER = ["partHead", "partTorso", "partArmL", "partArmR", "partLegL", "partLegR"];
const QWERTY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const STATS_KEY = "gallowsGuesses.stats";
const SOUND_KEY = "gallowsGuesses.soundOn";

/* ---------- State ---------- */

let state = {
  category: null,
  word: "",
  clue: "",
  guessed: new Set(),
  wrong: 0
};

/* ---------- Elements ---------- */

const els = {
  pickerScreen: document.getElementById("pickerScreen"),
  gameScreen: document.getElementById("gameScreen"),
  categoryGrid: document.getElementById("categoryGrid"),
  streakRow: document.getElementById("streakRow"),
  backBtn: document.getElementById("backBtn"),
  homeLink: document.getElementById("homeLink"),
  gameHeading: document.getElementById("gameHeading"),
  clueText: document.getElementById("clueText"),
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
  themeToggle: document.getElementById("themeToggle"),
  soundToggle: document.getElementById("soundToggle")
};

/* ---------- Stats (localStorage) ---------- */

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { current: 0, best: 0 };
    const parsed = JSON.parse(raw);
    return { current: parsed.current || 0, best: parsed.best || 0 };
  } catch {
    return { current: 0, best: 0 };
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* storage unavailable — stats just won't persist */
  }
}

function renderStreak() {
  const stats = loadStats();
  els.streakRow.innerHTML = `
    <span>Current streak: <strong>${stats.current}</strong></span>
    <span>Best streak: <strong>${stats.best}</strong></span>
  `;
}

function recordResult(won) {
  const stats = loadStats();
  if (won) {
    stats.current += 1;
    stats.best = Math.max(stats.best, stats.current);
  } else {
    stats.current = 0;
  }
  saveStats(stats);
  renderStreak();
}

/* ---------- Sound (Web Audio API — no external files) ---------- */

let audioCtx = null;
let soundOn = true;

try {
  soundOn = localStorage.getItem(SOUND_KEY) !== "off";
} catch {
  soundOn = true;
}

function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
}

function playTone(freq, duration, type = "sine", delay = 0, gainLevel = 0.15) {
  if (!soundOn) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = gainLevel;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const start = ctx.currentTime + delay;
  osc.start(start);
  gain.gain.setValueAtTime(gainLevel, start + duration * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.stop(start + duration);
}

function playCorrectSound() {
  playTone(660, 0.15, "sine");
  playTone(880, 0.15, "sine", 0.08);
}

function playWrongSound() {
  playTone(160, 0.25, "sawtooth", 0, 0.12);
}

function playWinSound() {
  [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.25, "triangle", i * 0.12));
}

function playLossSound() {
  [400, 320, 240, 160].forEach((f, i) => playTone(f, 0.35, "sawtooth", i * 0.15, 0.1));
}

function setSoundUI() {
  els.soundToggle.setAttribute("aria-pressed", soundOn ? "true" : "false");
  els.soundToggle.setAttribute("aria-label", soundOn ? "Mute sound" : "Unmute sound");
  els.soundToggle.querySelector(".icon-toggle__glyph").textContent = soundOn ? "♪" : "✕";
}

els.soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  try {
    localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off");
  } catch {
    /* ignore */
  }
  setSoundUI();
  if (soundOn) playTone(500, 0.1, "sine");
});

/* ---------- Category picker ---------- */

function buildCategoryGrid() {
  els.categoryGrid.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const btn = document.createElement("button");
    btn.className = "category-card";
    btn.setAttribute("role", "listitem");
    btn.innerHTML = `
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
  const entry = cat.words[Math.floor(Math.random() * cat.words.length)];

  state = { category: categoryKey, word: entry.word, clue: entry.clue, guessed: new Set(), wrong: 0 };

  els.gameHeading.textContent = cat.name;
  els.clueText.textContent = `Clue: ${entry.clue}`;
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

function goHome() {
  els.gameScreen.hidden = true;
  els.pickerScreen.hidden = false;
  renderStreak();
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
    playCorrectSound();
    renderWord();
    checkWin();
  } else {
    state.wrong += 1;
    key.classList.add("wrong");
    key.disabled = true;
    showStatus(`"${letter}" isn't in the word.`, "bad");
    playWrongSound();

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
  showStatus(`You got it — "${state.word}"!`, "good");
  setWinFace();
  playWinSound();
  recordResult(true);
  endRound();
}

function checkLoss() {
  if (state.wrong < MAX_WRONG) return;
  showStatus(`Out of guesses — it was "${state.word}".`, "bad");
  playLossSound();
  recordResult(false);
  endRound();
}

function endRound() {
  document.querySelectorAll(".key").forEach(k => (k.disabled = true));
  els.playAgainBtn.hidden = false;
}

/* ---------- Navigation ---------- */

els.backBtn.addEventListener("click", goHome);
els.homeLink.addEventListener("click", goHome);

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

setSoundUI();
renderStreak();
buildCategoryGrid();
