// Emberfall — input.js: mouse and keyboard. One job: turn clicks and keys into
// game actions. It never touches the rules itself; it calls the state's functions.

import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSE, playCard, endPlayerTurn, startDuel } from './state.js';
import { layoutHand, endTurnRect } from './render.js';
import { playSelectSound, playCardSound } from './sound.js';

/** Which hand card, if any, sits under point (x, y) in canvas coordinates. */
export function cardAt(game, x, y) {
  const spots = layoutHand(game);
  for (let i = spots.length - 1; i >= 0; i -= 1) {
    const s = spots[i];
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return i;
  }
  return -1;
}

function pointIn(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** Handle a click at canvas coordinates (x, y). Returns true if it did anything. */
export function handleClick(game, x, y) {
  if (game.screen === SCREEN_TITLE) {
    game.screen = SCREEN_PLAY;
    return true;
  }
  if (game.screen === SCREEN_WIN || game.screen === SCREEN_LOSE) {
    return false; // R restarts from the end screens
  }
  if (game.screen !== SCREEN_PLAY || game.phase !== 'player') return false;
  const b = endTurnRect();
  if (pointIn(b, x, y)) {
    endPlayerTurn(game);
    return true;
  }
  const index = cardAt(game, x, y);
  if (index < 0) {
    game.ui.selected = -1;
    return false;
  }
  if (game.ui.selected === index) {
    // Second click on the selected card plays it.
    const card = game.player.hand[index];
    if (card && playCard(game, game.player, game.opponent, card)) {
      playCardSound();
      game.ui.selected = -1;
      return true;
    }
    game.ui.selected = -1;
    return false;
  }
  game.ui.selected = index;
  playSelectSound();
  return true;
}

/** Handle a key press. `key` is the KeyboardEvent key value. */
export function handleKey(game, key) {
  const k = key.toLowerCase();
  if (game.screen === SCREEN_TITLE && (k === 'enter' || k === ' ')) {
    game.screen = SCREEN_PLAY;
    return true;
  }
  if ((game.screen === SCREEN_WIN || game.screen === SCREEN_LOSE) && k === 'r') {
    const fresh = startDuel(game);
    Object.assign(game, fresh);
    return true;
  }
  if (game.screen !== SCREEN_PLAY || game.phase !== 'player') return false;
  if (k === 'e') {
    endPlayerTurn(game);
    return true;
  }
  if (k === 'enter' || k === ' ') {
    const index = game.ui.selected;
    if (index >= 0 && index < game.player.hand.length) {
      const card = game.player.hand[index];
      if (playCard(game, game.player, game.opponent, card)) {
        playCardSound();
        game.ui.selected = -1;
        return true;
      }
    }
    return false;
  }
  const digit = parseInt(k, 10);
  if (digit >= 1 && digit <= game.player.hand.length) {
    game.ui.selected = digit - 1;
    playSelectSound();
    return true;
  }
  if (k === 'escape') {
    game.ui.selected = -1;
    return true;
  }
  return false;
}

/** Which hand card the mouse is over, for the hover lift. -1 when none. */
export function hoverAt(game, x, y) {
  if (game.screen !== SCREEN_PLAY || game.phase !== 'player') return -1;
  return cardAt(game, x, y);
}
