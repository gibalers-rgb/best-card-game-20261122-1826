// Emberfall — shots.js: the screenshot scenes behind ?shot=title|play|win|lose.
// One job: stage a real game state for each screenshot. Every scene plays the
// real rules forward from a fresh seeded duel, steered by simple autopilots, so
// each frame is what a short game really looks like — and the same seed always
// gives the same frame.

import { createGame, playCard, endPlayerTurn, runOpponentTurn, SCREEN_PLAY } from './state.js';
import { chooseCard, chooseTimidCard, chooseNoCard } from './ai.js';

const PLAY_TURNS = 3;
const MAX_TURNS = 200;

/** Play one full turn: the player picks, then the Warden answers. */
function simulateTurn(game, playerPick, opponentPick, maxPlays = 12) {
  let guard = 0;
  let played = 0;
  while (game.phase === 'player' && guard < 12 && played < maxPlays) {
    guard += 1;
    const card = playerPick(game, game.player, game.opponent);
    if (!card) break;
    playCard(game, game.player, game.opponent, card);
    played += 1;
    if (game.phase === 'over') return;
  }
  if (game.phase === 'over') return;
  endPlayerTurn(game);
  runOpponentTurn(game, opponentPick, maxPlays);
}

/** Freeze the "just played" pop animation so the frame is fully settled. */
function settle(game) {
  for (const side of [game.player, game.opponent]) {
    if (side.lastPlay) side.lastPlay.at = 0;
  }
}

/**
 * Set a fresh game to the named scene (title, play, win or lose) and return it.
 * Any other name is the title. `seed` picks the shuffle; the same seed replays
 * the same scene.
 */
export function stageShot(name, seed) {
  const game = createGame(seed);
  game.ui = { selected: -1, hover: -1 };
  if (name !== 'play' && name !== 'win' && name !== 'lose') {
    game.screen = 'title';
    return game;
  }
  game.screen = SCREEN_PLAY;
  if (name === 'play') {
    // A mid-duel table: both sides have played, both hands still look full.
    for (let t = 0; t < PLAY_TURNS && game.phase !== 'over'; t += 1) {
      simulateTurn(game, chooseCard, chooseCard, 2);
    }
    game.screen = SCREEN_PLAY;
    settle(game);
    return game;
  }
  if (name === 'win') {
    // A sharp player against a Warden that only guards and mends.
    for (let t = 0; t < MAX_TURNS && game.phase !== 'over'; t += 1) {
      simulateTurn(game, chooseCard, chooseTimidCard);
    }
    settle(game);
    return game;
  }
  // lose: a player that never plays, against a full-strength Warden.
  for (let t = 0; t < MAX_TURNS && game.phase !== 'over'; t += 1) {
    simulateTurn(game, chooseNoCard, chooseCard);
  }
  settle(game);
  return game;
}
