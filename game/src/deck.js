// Emberfall — deck.js: seeded randomness, shuffling and drawing.
// One job: the random number generator and the deck. No game rules here.

/** mulberry32: a small deterministic PRNG, so a seed replays the same game. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle, driven by the given rng, returning a new array. */
export function shuffle(cards, rng) {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/**
 * Draw up to `count` cards from `deck` into `hand`. When the deck runs dry the
 * discard pile is shuffled back in (the classic reshuffle); when both are empty
 * nothing more is drawn. Returns how many cards were actually drawn.
 */
export function drawCards(deck, discard, hand, count, maxHand, rng) {
  let drawn = 0;
  for (let n = 0; n < count; n += 1) {
    if (hand.length >= maxHand) break;
    if (deck.length === 0) {
      if (discard.length === 0) break;
      while (discard.length > 0) deck.push(discard.pop());
      const reshuffled = shuffle(deck, rng);
      deck.length = 0;
      deck.push(...reshuffled);
    }
    hand.push(deck.pop());
    drawn += 1;
  }
  return drawn;
}
