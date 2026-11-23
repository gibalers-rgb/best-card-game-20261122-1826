# Emberfall — a duel of cinders and tides

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/gibalers-rgb/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/gibalers-rgb/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

A complete, original 1-v-1 card duel that runs offline in a desktop browser
from static files. Outplay **the Warden**: spend energy, play suits, chain
two cards of one suit in a turn for **RESONANCE +2**, and burn their 30 life
to zero before yours runs out.

## How to play

- **Goal:** reduce the Warden's 30 life to 0. Lose yours and the duel is lost.
- **Energy:** you gain a little more each turn (3, then 4, up to 6) and it
  refills every turn. Every card costs 1–3 energy.
- **Cards:** four suits — **Ember** (flame, red), **Tide** (wave, blue),
  **Grove** (leaf, green), **Stone** (peak, amber) — each told apart by colour
  *and* shape. Four kinds: **Strike** (damage), **Guard** (shield, lasts one
  round), **Mend** (heal), **Spark** (damage + draw a card).
- **Resonance:** the second card of a suit you play in one turn gains +2 to
  its effect. Plan your hand around it.
- **The Warden** plays by readable rules: it takes a kill when it sees one,
  guards when it is hurting, and otherwise plays the hardest hit for its cost.
  Read it, and counter it.

**Controls:** click a card to select it, click again (or press Enter) to play;
keys `1`–`7` select, `E` ends the turn, `R` starts a new duel after it ends.

## Run it

Serve `game/` with any static server and open `game/index.html`, for example:

```sh
cd game && python3 -m http.server 8080
```

No build step, no network requests, no libraries — the game is one canvas
and a handful of ES modules under `game/src/`.

## Screenshots

The four screenshots under `screenshots/` are real renders of the game's own
code, staged deterministically with `?shot=`:

| shot | scene |
| --- | --- |
| `?shot=title` | title screen |
| `?shot=play` | mid-duel table |
| `?shot=win` | victory screen |
| `?shot=lose` | defeat screen |

Add `&seed=<n>` to replay a scene with a different shuffle.

## Layout

| file | job |
| --- | --- |
| `main.ts` | hand-in program: copies `game/` + `screenshots/` to `/output`, writes `dossier.json` |
| `game/index.html` | the page: canvas + module entry |
| `game/src/config.js` | constants: suits, the 32-card pool, life and energy rules |
| `game/src/deck.js` | seeded RNG, shuffle, draw and reshuffle |
| `game/src/state.js` | the duel: turns, playing cards, resonance, damage, shield, heal, win/loss |
| `game/src/ai.js` | the Warden's brain: kill-first, guard-when-hurting, best-value picks |
| `game/src/render.js` | everything drawn: title, table, cards, life bars, victory and defeat |
| `game/src/input.js` | mouse and keyboard → game actions |
| `game/src/sound.js` | synthesized WebAudio beeps (no audio files) |
| `game/src/shots.js` | deterministic screenshot scenes that play the real rules forward |
| `game/src/main.js` | bootstrap: canvas, game loop, Warden turn pacing, `?shot=` mode |
| `vendor/makefun-game.ts` | the kit's dossier library, unchanged |
