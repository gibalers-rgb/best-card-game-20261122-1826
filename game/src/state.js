// Emberfall — state.js: the duel itself. One job: the rules.
// A state holds both duelists, the turn, the log and the outcome. Playing a card,
// ending a turn and the AI's turn are all plain functions over the state, so the
// live game and the deterministic screenshot scenes run the exact same rules.

import {
  START_LIFE, START_HAND, MAX_HAND, DRAW_PER_TURN, MAX_ENERGY,
  RESONANCE_BONUS, buildDeck,
} from './config.js';
import { makeRng, shuffle, drawCards } from './deck.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSE = 'lose';

/** Milliseconds on the same clock the renderer uses (performance.now in browsers). */
function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function newDuelist(name, isPlayer) {
  return {
    name,
    isPlayer,
    life: START_LIFE,
    maxLife: START_LIFE,
    shield: 0,
    energy: 0,
    maxEnergy: 0,
    deck: [],
    discard: [],
    hand: [],
    played: [], // cards played this turn, in order (drives resonance)
    lastPlay: null, // the card most recently played, for the table display
  };
}

/** A fresh duel, decks shuffled from `seed`, both hands drawn, turn 1 open. */
export function createGame(seed) {
  const rng = makeRng(seed);
  const game = {
    seed,
    rng,
    turn: 1,
    screen: SCREEN_TITLE,
    phase: 'player', // 'player' | 'ai' | 'over'
    player: newDuelist('You', true),
    opponent: newDuelist('The Warden', false),
    log: [],
    winner: null,
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, turns: 0 },
    score: 0,
    message: '',
  };
  for (const side of [game.player, game.opponent]) {
    side.deck = shuffle(buildDeck(), rng);
    drawCards(side.deck, side.discard, side.hand, START_HAND, MAX_HAND, rng);
  }
  startPlayerTurn(game);
  return game;
}

export function energyForTurn(turn) {
  return Math.min(turn + 2, MAX_ENERGY);
}

function startPlayerTurn(game) {
  const p = game.player;
  p.shield = 0; // shield is for one round: it fades when your turn begins
  p.maxEnergy = energyForTurn(game.turn);
  p.energy = p.maxEnergy;
  p.played = [];
  drawCards(p.deck, p.discard, p.hand, DRAW_PER_TURN, MAX_HAND, game.rng);
  game.phase = 'player';
  game.stats.turns = game.turn;
}

function startOpponentTurn(game) {
  const o = game.opponent;
  o.shield = 0; // shield is for one round: it fades when the Warden's turn begins
  o.maxEnergy = energyForTurn(game.turn);
  o.energy = o.maxEnergy;
  o.played = [];
  drawCards(o.deck, o.discard, o.hand, DRAW_PER_TURN, MAX_HAND, game.rng);
  game.phase = 'ai';
}

/** Damage first eats shield, then life. Returns the life actually lost. */
export function dealDamage(target, amount) {
  let left = amount;
  const absorbed = Math.min(target.shield, left);
  target.shield -= absorbed;
  left -= absorbed;
  const before = target.life;
  target.life = Math.max(0, target.life - left);
  return before - target.life;
}

export function heal(target, amount) {
  const before = target.life;
  target.life = Math.min(target.maxLife, target.life + amount);
  return target.life - before;
}

/**
 * Resonance: the second (and later) card of a suit played in the same turn
 * gains +2 to its effect. Returns the bonus for this card, 0 or +2.
 */
export function resonanceBonus(duelist, card) {
  for (const played of duelist.played) {
    if (played.suit === card.suit) return RESONANCE_BONUS;
  }
  return 0;
}

export function cardEffectText(card, bonus) {
  const v = card.value + bonus;
  if (card.kind === 'strike') return `Deal ${v} damage`;
  if (card.kind === 'guard') return `Gain ${v} shield`;
  if (card.kind === 'mend') return `Heal ${v} life`;
  return `Deal ${v} damage, draw a card`;
}

function log(game, text) {
  game.log.push(text);
  if (game.log.length > 6) game.log.shift();
}

/**
 * Play `card` from `duelist`'s hand against `foe`. Returns false when the card
 * cannot be played (not in hand, not enough energy, wrong phase); otherwise
 * applies the effect, moves the card to the discard pile and returns true.
 */
export function playCard(game, duelist, foe, card) {
  const at = duelist.hand.indexOf(card);
  if (at < 0) return false;
  if (card.cost > duelist.energy) return false;
  const bonus = resonanceBonus(duelist, card);
  const value = card.value + bonus;
  duelist.energy -= card.cost;
  duelist.hand.splice(at, 1);
  duelist.discard.push(card);
  duelist.played.push(card);
  duelist.lastPlay = { card, bonus, at: nowMs() };
  game.stats.cardsPlayed += 1;

  let text = `${duelist.name} plays ${cardName(card)}`;
  if (bonus > 0) text += ` — RESONANCE +${bonus}!`;
  if (card.kind === 'strike') {
    const lost = dealDamage(foe, value);
    text += lost > 0 ? `, dealing ${lost} damage` : ', but the shield holds';
    if (duelist.isPlayer) game.stats.damageDealt += lost;
    else game.stats.damageTaken += lost;
  } else if (card.kind === 'guard') {
    duelist.shield += value;
    text += `, gaining ${value} shield`;
  } else if (card.kind === 'mend') {
    const healed = heal(duelist, value);
    text += `, healing ${healed} life`;
  } else {
    const lost = dealDamage(foe, value);
    text += lost > 0 ? `, dealing ${lost} damage and drawing a card` : ', but the shield holds, and drawing a card';
    if (duelist.isPlayer) game.stats.damageDealt += lost;
    else game.stats.damageTaken += lost;
    drawCards(duelist.deck, duelist.discard, duelist.hand, 1, MAX_HAND, game.rng);
  }
  log(game, text);
  game.score = game.stats.damageDealt + (game.winner === 'player' ? 50 : 0);
  checkEnd(game);
  return true;
}

export function cardName(card) {
  const suit = card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
  const kind = card.kind.charAt(0).toUpperCase() + card.kind.slice(1);
  return `${suit} ${kind} ${card.value}`;
}

/** The cards in `duelist`'s hand that can be afforded right now. */
export function playableCards(duelist) {
  return duelist.hand.filter((c) => c.cost <= duelist.energy);
}

function checkEnd(game) {
  if (game.phase === 'over') return;
  if (game.opponent.life <= 0) {
    game.winner = 'player';
    game.phase = 'over';
    game.screen = SCREEN_WIN;
    game.score = game.stats.damageDealt + 50;
    log(game, 'The Warden falls. Victory is yours!');
  } else if (game.player.life <= 0) {
    game.winner = 'opponent';
    game.phase = 'over';
    game.screen = SCREEN_LOSE;
    log(game, 'Your embers fade. The Warden wins.');
  }
}

/** End the player's turn: the Warden plays, then a new turn begins. */
export function endPlayerTurn(game) {
  if (game.phase !== 'player' || game.screen !== SCREEN_PLAY) return false;
  startOpponentTurn(game);
  return true;
}

/** Run the Warden's whole turn at once (the live game steps it out visually). */
export function runOpponentTurn(game, chooseCard, maxPlays = 12) {
  if (game.phase !== 'ai') return;
  let guard = 0;
  let played = 0;
  while (game.phase === 'ai' && guard < 12 && played < maxPlays) {
    guard += 1;
    const card = chooseCard(game, game.opponent, game.player);
    if (!card) break;
    playCard(game, game.opponent, game.player, card);
    played += 1;
    if (game.phase === 'over') return;
  }
  if (game.phase === 'over') return;
  game.turn += 1;
  startPlayerTurn(game);
}

/** Start a fresh duel from the title screen, keeping the same seed family. */
export function startDuel(game) {
  const fresh = createGame(game.seed + 1);
  fresh.screen = SCREEN_PLAY;
  return fresh;
}
