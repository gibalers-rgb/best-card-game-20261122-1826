// Emberfall — ai.js: the Warden's brain. One job: choose the opponent's card.
// The Warden plays by readable rules, so its choices can be countered:
// it takes a kill when it sees one, it guards when it is hurting, and otherwise
// it plays the card that hurts most for its cost.

import { playableCards, resonanceBonus, cardEffectText } from './state.js';

/** Score a card for the Warden: higher is better. */
export function scoreCard(game, warden, player, card) {
  const bonus = resonanceBonus(warden, card);
  const value = card.value + bonus;
  let score = value / card.cost;
  if (card.kind === 'strike' || card.kind === 'spark') {
    // A kill is worth everything.
    if (value >= player.life + player.shield) score += 100;
    // Chips at a shielded foe are worth less; unshielded damage is worth more.
    score += player.shield > 0 ? -0.5 : 0.5;
    if (card.kind === 'spark') score += 0.4; // the draw is a bonus
  } else if (card.kind === 'guard') {
    // Guard matters when the Warden is low, or when you are about to hit hard.
    score += warden.life <= 12 ? 2.5 : 0.3;
    if (warden.shield > 0) score -= 0.8; // no need to stack shield
  } else if (card.kind === 'mend') {
    // Healing a full duelist is a wasted turn.
    score += warden.life >= warden.maxLife ? -2 : (warden.maxLife - warden.life) / 10;
  }
  // Resonance turns a middling card into a good one.
  if (bonus > 0) score += 1;
  return score;
}

/**
 * Pick the Warden's next card, or null when it should stop (nothing affordable,
 * or nothing worth playing). The live game calls this once per beat so each
 * card lands with a pause; the screenshot scenes call it in a loop.
 */
export function chooseCard(game, warden, player) {
  const playable = playableCards(warden);
  if (playable.length === 0) return null;
  let best = null;
  let bestScore = 1.0; // below this, the Warden holds its cards for a better turn
  for (const card of playable) {
    const score = scoreCard(game, warden, player, card);
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }
  return best;
}

/** A timid Warden for the win screenshot: it only guards and mends, never attacks. */
export function chooseTimidCard(game, warden, player) {
  const playable = playableCards(warden).filter(
    (c) => c.kind === 'guard' || c.kind === 'mend',
  );
  if (playable.length === 0) return null;
  let best = playable[0];
  for (const card of playable) {
    if (scoreCard(game, warden, player, card) > scoreCard(game, warden, player, best)) best = card;
  }
  return best;
}

/** A passive player for the loss screenshot: it never plays a card. */
export function chooseNoCard() {
  return null;
}

export { cardEffectText };
