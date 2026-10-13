// Home page motion. Everything here is decoration on top of a page that
// already reads fine without it; people who ask their device for reduced
// motion get the still version (see "Calm mode" in home.css).
// Uses t() from site.js.

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const lerp = (a, b, k) => a + (b - a) * k;
// Slow start and finish
const ease = (k) => k * k * (3 - 2 * k);

// ---------- The games ----------

const GAMES = [
  { key: "Avalon", glyph: "🎭", min: 5, max: 10, colors: ["#3f6fd8", "#1d2f6f"] },
  { key: "Coup", glyph: "💰", min: 2, max: 6, colors: ["#f08a2e", "#a3331c"] },
  { key: "Nightwatch", glyph: "🕯️", min: 5, max: 10, colors: ["#7c5cd6", "#2a1d5c"] },
  { key: "Liarsdice", glyph: "🎲", min: 2, max: 10, colors: ["#2fa86a", "#12503a"] },
  { key: "Manor", glyph: "🗝️", min: 4, max: 8, colors: ["#c2488a", "#4f1740"] },
  { key: "Tictactoe", glyph: "❌", min: 2, max: 2, colors: ["#4b5a70", "#1f2937"] },
];

const deck = document.getElementById("deck");
const cards = GAMES.map((game) => {
  const seats = t(game.min === game.max ? "playersExact" : "players")
    .replace("{min}", game.min)
    .replace("{max}", game.max);
  const card = document.createElement("article");
  card.className = "game-card";
  card.innerHTML = `
    <div class="card-back"><svg viewBox="0 0 100 100"><use href="#meeple" /></svg></div>
    <div class="card-front" style="--c1: ${game.colors[0]}; --c2: ${game.colors[1]}">
      <span class="glyph" aria-hidden="true">${game.glyph}</span>
      <div>
        <h3></h3>
        <p></p>
        <span class="seats"></span>
      </div>
    </div>`;
  card.querySelector("h3").textContent = t(`game${game.key}`);
  card.querySelector("p").textContent = t(`game${game.key}Tag`);
  card.querySelector(".seats").textContent = seats;
  deck.append(card);
  return card;
});

// p runs 0 to 1 over the section: a neat deck, fanned out like a hand,
// flipped face up, then dealt into a row that slides past if it is
// wider than the screen.
function layOutDeck(p) {
  const cardW = cards[0].offsetWidth;
  const gap = Math.min(24, cardW * 0.1);
  const middle = (cards.length - 1) / 2;
  const fan = ease(clamp(p / 0.22));
  const spread = ease(clamp((p - 0.3) / 0.25));
  const pan = clamp((p - 0.5) / 0.45);

  const rowW = cards.length * cardW + (cards.length - 1) * gap;
  const spare = Math.max(0, rowW - deck.offsetWidth + 40);
  const panX = (spare / 2) * (1 - 2 * pan) * spread;

  cards.forEach((card, i) => {
    const o = i - middle;
    const flip = ease(clamp((p - 0.18 - i * 0.02) / 0.16));
    const x = lerp(lerp(o * 2, o * cardW * 0.24, fan), o * (cardW + gap) + panX, spread);
    const y = lerp(-o * 2, o * o * cardW * 0.035, fan) * (1 - spread);
    const tilt = o * 8 * fan * (1 - spread);
    card.style.transform =
      `translate(${x}px, ${y}px) rotate(${tilt}deg) rotateY(${flip * 180}deg)`;
    card.style.zIndex = i;
  });
}

// ---------- How it works ----------

const how = document.querySelector(".how");
const seats = [...document.querySelectorAll(".seat")];
const confetti = document.getElementById("confetti");
const codeTiles = document.getElementById("code-tiles");
const CODE = "AB12CD";
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

for (const letter of CODE) {
  const tile = document.createElement("span");
  tile.textContent = letter;
  codeTiles.append(tile);
}

for (let i = 0; i < 28; i++) {
  const bit = document.createElement("i");
  const angle = (i / 28) * Math.PI * 2;
  const reach = 120 + Math.random() * 140;
  bit.style.setProperty("--c", ["#ffc83d", "#ff8a3d", "#46b96b", "#4a8fe8", "#e85d5d", "#7c5cd6"][i % 6]);
  bit.style.setProperty("--tx", `${Math.cos(angle) * reach}px`);
  bit.style.setProperty("--ty", `${Math.sin(angle) * reach}px`);
  bit.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
  confetti.append(bit);
}

// The code spins through random letters, then settles left to right
let shuffling = false;
function shuffleCode() {
  if (shuffling) return;
  shuffling = true;
  const tiles = [...codeTiles.children];
  let tick = 0;
  const timer = setInterval(() => {
    tick++;
    tiles.forEach((tile, i) => {
      const settled = tick > 6 + i * 3;
      tile.textContent = settled
        ? CODE[i]
        : LETTERS[Math.floor(Math.random() * LETTERS.length)];
    });
    if (tick > 6 + tiles.length * 3) {
      clearInterval(timer);
      shuffling = false;
    }
  }, 55);
}

let lastStep = 0;
let everyoneIn = false;
function layOutTable(p) {
  // Thirds: open a table, share the code, everyone's in
  const step = p < 0.3 ? 0 : p < 0.58 ? 1 : 2;
  if (step !== lastStep) {
    how.dataset.step = step;
    if (step === 1 && lastStep === 0) shuffleCode();
    lastStep = step;
  }

  // The host is there from the start; the rest arrive one by one
  seats.forEach((seat, i) => {
    seat.classList.toggle("in", i === 0 ? p > 0.04 : p > 0.56 + i * 0.06);
  });

  const full = p > 0.92;
  if (full !== everyoneIn) {
    everyoneIn = full;
    confetti.classList.toggle("pop", full);
  }
}

// ---------- Scroll and pointer ----------

const hero = document.querySelector(".hero");
const pinned = [
  [document.querySelector('[data-pin="deal"]'), layOutDeck],
  [how, layOutTable],
];

function onFrame() {
  hero.style.setProperty("--sy", clamp(scrollY / innerHeight).toFixed(3));
  for (const [section, layOut] of pinned) {
    const travel = section.offsetHeight - innerHeight;
    layOut(clamp(-section.getBoundingClientRect().top / travel));
  }
}

if (calm) {
  // Still version: the table is simply full
  how.dataset.step = 2;
  seats.forEach((seat) => seat.classList.add("in"));
} else {
  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      onFrame();
    });
  };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  onFrame();

  // The meeple and the loose pieces lean with the pointer
  hero.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const box = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
    hero.style.setProperty("--my", (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
  });
  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--mx", 0);
    hero.style.setProperty("--my", 0);
  });
}

// Poke the meeple and it hops
const heroMeeple = document.querySelector(".hero-meeple");
heroMeeple.addEventListener("click", () => {
  heroMeeple.classList.remove("hop");
  void heroMeeple.offsetWidth; // restart the animation
  heroMeeple.classList.add("hop");
});

// ---------- Dice ----------

// Pips on a 3×3 grid, numbered 1 to 9 left to right, top to bottom
const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
// How to turn the cube so each face looks at you
const TURNS = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 2: [-90, 0], 5: [90, 0] };
const FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const diceRow = document.getElementById("dice");
const rollResult = document.getElementById("roll-result");
const rollButton = document.getElementById("roll-button");

const dice = Array.from({ length: 5 }, () => {
  const die = document.createElement("div");
  die.className = "die";
  for (let value = 1; value <= 6; value++) {
    const face = document.createElement("div");
    face.className = `face face-${value}`;
    for (const cell of PIPS[value]) {
      const pip = document.createElement("i");
      pip.style.gridArea = `${Math.ceil(cell / 3)} / ${((cell - 1) % 3) + 1}`;
      face.append(pip);
    }
    die.append(face);
  }
  diceRow.append(die);
  return { el: die, x: 0, y: 0 };
});

function roll() {
  const counts = {};
  dice.forEach((die, i) => {
    const value = 1 + Math.floor(Math.random() * 6);
    counts[value] = (counts[value] || 0) + 1;
    const [x, y] = TURNS[value];
    // Always tumble forward a few whole turns before landing
    die.x = Math.ceil(die.x / 360) * 360 + 360 * (1 + (i % 2)) + x;
    die.y = Math.ceil(die.y / 360) * 360 + 360 * (2 - (i % 2)) + y;
    die.el.style.transitionDelay = `${i * 60}ms`;
    die.el.style.transform = `rotateX(${die.x}deg) rotateY(${die.y}deg)`;
  });

  // Report the best set, the way you'd call it in Liar's Dice
  const [value, count] = Object.entries(counts).sort(
    (a, b) => b[1] - a[1] || b[0] - a[0]
  )[0];
  const quips = t("rollQuips");
  rollResult.textContent = " ";
  setTimeout(
    () => {
      const quip = quips[Math.floor(Math.random() * quips.length)];
      rollResult.innerHTML = `${count} × <b>${FACES[value]}</b> `;
      rollResult.append(quip);
    },
    calm ? 0 : 1400
  );
}

rollButton.addEventListener("click", roll);

// First roll happens by itself when the dice scroll into view
new IntersectionObserver(
  (entries, observer) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      roll();
      observer.disconnect();
    }
  },
  { threshold: 0.6 }
).observe(diceRow);
