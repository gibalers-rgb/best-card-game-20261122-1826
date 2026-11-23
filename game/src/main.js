// Emberfall — main.js: the bootstrap. One job: wire the game together.
// It owns the canvas, the animation loop, the Warden's turn pacing and the
// ?shot= / ?seed= query params used for screenshots.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import { createGame, playCard, runOpponentTurn, SCREEN_PLAY } from './state.js';
import { chooseCard } from './ai.js';
import { render } from './render.js';
import { handleClick, handleKey, hoverAt } from './input.js';
import { playWinSound, playLoseSound } from './sound.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = parseInt(params.get('seed') || '20261122', 10) || 20261122;

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

const game = shotName ? stageShot(shotName, seed) : createGame(seed);
game.ui = game.ui || { selected: -1, hover: -1 };

// The Warden plays one card per beat, so its turn reads as a sequence.
let aiBeatAt = 0;
const AI_BEAT_MS = 650;
let endSoundPlayed = false;

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
  };
}

canvas.addEventListener('click', (event) => {
  const p = canvasPoint(event);
  handleClick(game, p.x, p.y);
});

canvas.addEventListener('mousemove', (event) => {
  const p = canvasPoint(event);
  game.ui.hover = hoverAt(game, p.x, p.y);
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  handleKey(game, event.key);
});

/** Step the Warden's turn: one card per beat, then the next player turn. */
function stepAiTurn(now) {
  if (game.phase !== 'ai' || game.screen !== SCREEN_PLAY) return;
  if (now - aiBeatAt < AI_BEAT_MS) return;
  aiBeatAt = now;
  const card = chooseCard(game, game.opponent, game.player);
  if (!card) {
    // Nothing worth playing: close the turn and hand it back.
    runOpponentTurn(game, () => null);
    return;
  }
  playCard(game, game.opponent, game.player, card);
  if (game.phase === 'over') return;
  if (chooseCard(game, game.opponent, game.player) === null) {
    runOpponentTurn(game, () => null);
  }
}

function frame(now) {
  if (game.phase === 'ai' && game.screen === SCREEN_PLAY) stepAiTurn(now);
  if (game.phase === 'over' && !endSoundPlayed) {
    endSoundPlayed = true;
    if (game.winner === 'player') playWinSound();
    else playLoseSound();
  }
  if (game.screen === SCREEN_PLAY && game.phase === 'player') endSoundPlayed = false;
  render(ctx, game, now);
  requestAnimationFrame(frame);
}

if (shotName) {
  // Screenshot mode: one settled frame, no loop, no timers.
  render(ctx, game, 1e9);
} else {
  requestAnimationFrame(frame);
}
