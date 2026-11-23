// Emberfall — a 1v1 card duel of cinders and tides.
// config.js: every number the game runs on — canvas size, suits, the card pool,
// life and energy rules. One job: constants, no logic.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;

export const START_LIFE = 30;
export const START_HAND = 4;
export const MAX_HAND = 7;
export const DRAW_PER_TURN = 1;
export const MAX_ENERGY = 6;
export const RESONANCE_BONUS = 2;

// The four suits. Each suit is told apart by colour AND shape, never by text alone:
// Ember is a flame (red), Tide a wave (blue), Grove a leaf (green), Stone a peak (amber).
export const SUITS = {
  ember: { name: 'Ember', color: '#e2483d', dark: '#8f1d16', glyph: 'flame' },
  tide: { name: 'Tide', color: '#2f7fd0', dark: '#174a80', glyph: 'wave' },
  grove: { name: 'Grove', color: '#3d9e57', dark: '#1e5c30', glyph: 'leaf' },
  stone: { name: 'Stone', color: '#d99a2b', dark: '#7d5510', glyph: 'peak' },
};
export const SUIT_KEYS = ['ember', 'tide', 'grove', 'stone'];

// Card kinds. Strike hurts, Guard shields, Mend heals, Spark hurts and draws.
export const KINDS = {
  strike: { name: 'Strike', verb: 'deals' },
  guard: { name: 'Guard', verb: 'shields' },
  mend: { name: 'Mend', verb: 'heals' },
  spark: { name: 'Spark', verb: 'sparks' },
};

// The deck: 8 cards per suit, 32 in all. [kind, cost, value]
const POOL = [
  ['strike', 1, 3],
  ['strike', 2, 5],
  ['strike', 3, 7],
  ['guard', 1, 3],
  ['guard', 2, 5],
  ['mend', 1, 3],
  ['mend', 2, 5],
  ['spark', 1, 2],
];

/** The full 32-card deck, one fresh card object per entry. */
export function buildDeck() {
  const deck = [];
  let id = 0;
  for (const suit of SUIT_KEYS) {
    for (const [kind, cost, value] of POOL) {
      deck.push({ id: id++, suit, kind, cost, value });
    }
  }
  return deck;
}

export const PLAYER_NAME = 'You';
export const OPPONENT_NAME = 'The Warden';
export const GAME_TITLE = 'EMBERFALL';
export const GAME_SUBTITLE = 'a duel of cinders and tides';
