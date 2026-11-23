// Emberfall — render.js: everything the eye sees. One job: draw the game.
// All four screens (title, table, victory, defeat) are drawn on one canvas at
// 1280x800, with big cards and big numbers so the game reads at thumbnail size.

import { CANVAS_WIDTH, CANVAS_HEIGHT, SUITS, START_LIFE } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSE, cardEffectText, resonanceBonus } from './state.js';

export const CARD_W = 148;
export const CARD_H = 208;
export const PLAYED_W = 132;
export const PLAYED_H = 184;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSuitGlyph(ctx, glyph, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size / 12);
  ctx.lineJoin = 'round';
  const s = size;
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s / 2);
    ctx.bezierCurveTo(cx + s * 0.42, cy - s * 0.1, cx + s * 0.3, cy + s * 0.28, cx + s * 0.12, cy + s * 0.42);
    ctx.bezierCurveTo(cx + s * 0.05, cy + s * 0.5, cx - s * 0.05, cy + s * 0.5, cx - s * 0.12, cy + s * 0.42);
    ctx.bezierCurveTo(cx - s * 0.3, cy + s * 0.28, cx - s * 0.42, cy - s * 0.1, cx, cy - s / 2);
    ctx.fill();
  } else if (glyph === 'wave') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i += 1) {
      const x = cx - s / 2 + (i / 24) * s;
      const y = cy - s * 0.12 + Math.sin((i / 24) * Math.PI * 2) * s * 0.16;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = 24; i >= 0; i -= 1) {
      const x = cx - s / 2 + (i / 24) * s;
      const y = cy + s * 0.18 + Math.sin((i / 24) * Math.PI * 2 + 1.2) * s * 0.16;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (glyph === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s / 2);
    ctx.bezierCurveTo(cx + s * 0.45, cy - s * 0.2, cx + s * 0.4, cy + s * 0.35, cx, cy + s / 2);
    ctx.bezierCurveTo(cx - s * 0.4, cy + s * 0.35, cx - s * 0.45, cy - s * 0.2, cx, cy - s / 2);
    ctx.fill();
    ctx.strokeStyle = '#f5ead0';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.35);
    ctx.lineTo(cx, cy + s * 0.42);
    ctx.stroke();
  } else {
    // peak
    ctx.beginPath();
    ctx.moveTo(cx, cy - s / 2);
    ctx.lineTo(cx + s / 2, cy + s / 2);
    ctx.lineTo(cx - s / 2, cy + s / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5ead0';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s / 2);
    ctx.lineTo(cx + s * 0.22, cy - s * 0.08);
    ctx.lineTo(cx, cy + s * 0.02);
    ctx.lineTo(cx - s * 0.22, cy - s * 0.08);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** The hand's card rectangles, fanned across the bottom of the table. */
export function layoutHand(game) {
  const hand = game.player.hand;
  const n = hand.length;
  const gap = Math.min(CARD_W + 14, (CANVAS_WIDTH - 320) / Math.max(1, n));
  const total = gap * (n - 1) + CARD_W;
  const startX = (CANVAS_WIDTH - total) / 2;
  const baseY = 556;
  return hand.map((card, i) => {
    const lift = i === game.ui?.selected ? -26 : 0;
    return { card, x: startX + i * gap, y: baseY + lift, w: CARD_W, h: CARD_H, index: i };
  });
}

/** The End Turn button rectangle. */
export function endTurnRect() {
  return { x: 1072, y: 700, w: 168, h: 56 };
}

function drawCard(ctx, card, x, y, w, h, opts = {}) {
  const suit = SUITS[card.suit];
  const scale = w / CARD_W;
  ctx.save();
  if (opts.dim) ctx.globalAlpha = 0.45;
  // Card body: cream face, suit-coloured rim.
  roundRect(ctx, x, y, w, h, 12 * scale);
  ctx.fillStyle = '#f7efdc';
  ctx.fill();
  ctx.lineWidth = 3 * scale;
  ctx.strokeStyle = suit.color;
  ctx.stroke();
  // Suit band across the top.
  ctx.save();
  roundRect(ctx, x + 3 * scale, y + 3 * scale, w - 6 * scale, 30 * scale, 9 * scale);
  ctx.fillStyle = suit.color;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff8e8';
  ctx.font = `bold ${15 * scale}px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(suit.name.toUpperCase(), x + 12 * scale, y + 19 * scale);
  // Cost pip, top right.
  ctx.beginPath();
  ctx.arc(x + w - 24 * scale, y + 24 * scale, 17 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#2b2118';
  ctx.fill();
  ctx.fillStyle = '#ffd970';
  ctx.font = `bold ${20 * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), x + w - 24 * scale, y + 25 * scale);
  // Big suit glyph in the middle.
  drawSuitGlyph(ctx, suit.glyph, x + w / 2, y + h * 0.44, 62 * scale, suit.color);
  // Big value.
  ctx.fillStyle = '#2b2118';
  ctx.font = `bold ${44 * scale}px Georgia, serif`;
  ctx.fillText(String(card.value), x + w / 2, y + h * 0.68);
  // Kind name and effect.
  ctx.font = `bold ${17 * scale}px Georgia, serif`;
  const kindName = card.kind.charAt(0).toUpperCase() + card.kind.slice(1);
  ctx.fillText(kindName, x + w / 2, y + h * 0.82);
  ctx.font = `${12.5 * scale}px Georgia, serif`;
  ctx.fillStyle = '#5c4a33';
  const bonus = opts.bonus || 0;
  ctx.fillText(cardEffectText(card, bonus), x + w / 2, y + h * 0.92);
  if (opts.selected) {
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 14 * scale);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffd970';
    ctx.stroke();
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#3a2a4d';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffd970';
  ctx.stroke();
  roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 7);
  ctx.strokeStyle = 'rgba(255,217,112,0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawSuitGlyph(ctx, 'flame', x + w / 2, y + h / 2, 44, '#ffd970');
  ctx.restore();
}

function drawLifeBar(ctx, x, y, w, h, life, maxLife, shield, label) {
  ctx.save();
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f5ead0';
  ctx.fillText(label, x, y - 16);
  if (shield > 0) {
    // Drawn shield, not an emoji: it must render in any browser. It sits on
    // the label line, clear of the hand below.
    const lx = x + ctx.measureText(label).width + 18;
    const sy = y - 16;
    ctx.beginPath();
    ctx.moveTo(lx, sy - 9);
    ctx.lineTo(lx + 8, sy - 6);
    ctx.lineTo(lx + 8, sy + 2);
    ctx.quadraticCurveTo(lx + 8, sy + 9, lx, sy + 12);
    ctx.quadraticCurveTo(lx - 8, sy + 9, lx - 8, sy + 2);
    ctx.lineTo(lx - 8, sy - 6);
    ctx.closePath();
    ctx.fillStyle = '#8fd0ff';
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8fd0ff';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.fillText(`${shield} shield`, lx + 14, sy + 1);
  }
  roundRect(ctx, x, y, w, h, 9);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  const frac = Math.max(0, life / maxLife);
  if (frac > 0) {
    roundRect(ctx, x + 2, y + 2, (w - 4) * frac, h - 4, 7);
    ctx.fillStyle = life <= 10 ? '#e2483d' : '#e8b23a';
    ctx.fill();
  }
  ctx.fillStyle = '#fff8e8';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${life} / ${maxLife}`, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function drawTable(ctx, game) {
  // Felt.
  const felt = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  felt.addColorStop(0, '#1e5230');
  felt.addColorStop(1, '#123a20');
  ctx.fillStyle = felt;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Gold inner border.
  ctx.strokeStyle = 'rgba(255,217,112,0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, CANVAS_WIDTH - 28, CANVAS_HEIGHT - 28);
  // Centre emblem.
  ctx.save();
  ctx.globalAlpha = 0.12;
  drawSuitGlyph(ctx, 'flame', CANVAS_WIDTH / 2, 330, 260, '#ffd970');
  ctx.restore();
}

function drawOpponentRow(ctx, game) {
  const o = game.opponent;
  drawLifeBar(ctx, 40, 44, 360, 26, o.life, o.maxLife, o.shield, 'THE WARDEN');
  // Opponent's hand, face down.
  const n = o.hand.length;
  const w = 62;
  const h = 88;
  const gap = 72;
  const startX = (CANVAS_WIDTH - (gap * (n - 1) + w)) / 2;
  for (let i = 0; i < n; i += 1) {
    drawCardBack(ctx, startX + i * gap, 92, w, h);
  }
  ctx.fillStyle = 'rgba(245,234,208,0.75)';
  ctx.font = '14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${n} cards in hand`, CANVAS_WIDTH / 2, 200);
}

function drawPlayedCards(ctx, game, now) {
  const slots = [
    { side: game.player, x: 330, label: 'YOUR LAST PLAY' },
    { side: game.opponent, x: 818, label: "WARDEN'S LAST PLAY" },
  ];
  for (const slot of slots) {
    const last = slot.side.lastPlay;
    ctx.save();
    ctx.fillStyle = 'rgba(245,234,208,0.8)';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(slot.label, slot.x + PLAYED_W / 2, 232);
    if (last) {
      const age = now - last.at;
      const pop = age < 220 ? 0.85 + (age / 220) * 0.15 : 1;
      const w = PLAYED_W * pop;
      const h = PLAYED_H * pop;
      drawCard(ctx, last.card, slot.x + (PLAYED_W - w) / 2, 244 + (PLAYED_H - h) / 2, w, h, { bonus: last.bonus });
    } else {
      ctx.strokeStyle = 'rgba(245,234,208,0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      roundRect(ctx, slot.x, 244, PLAYED_W, PLAYED_H, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(245,234,208,0.5)';
      ctx.font = '15px Georgia, serif';
      ctx.fillText('no card yet', slot.x + PLAYED_W / 2, 244 + PLAYED_H / 2);
    }
    ctx.restore();
  }
  // Turn banner in the middle.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd970';
  ctx.font = 'bold 26px Georgia, serif';
  const banner = game.phase === 'player' ? 'YOUR TURN' : game.phase === 'ai' ? 'THE WARDEN PLAYS…' : '';
  ctx.fillText(banner, CANVAS_WIDTH / 2, 300);
  ctx.fillStyle = '#f5ead0';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(`TURN ${game.turn}`, CANVAS_WIDTH / 2, 332);
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = 'rgba(245,234,208,0.85)';
  ctx.fillText('Play two cards of one suit in a turn', CANVAS_WIDTH / 2, 366);
  ctx.fillText('for RESONANCE +2', CANVAS_WIDTH / 2, 388);
  ctx.restore();
}

function drawLog(ctx, game) {
  ctx.save();
  roundRect(ctx, 1024, 216, 222, 210, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,217,112,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffd970';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('DUEL LOG', 1038, 238);
  ctx.fillStyle = '#f5ead0';
  ctx.font = '13.5px Georgia, serif';
  // Wrap every entry first, then draw line by line so entries never overlap.
  // Whole entries are dropped from the top when the box runs out of lines.
  const entries = [];
  for (const entry of game.log.slice(-6)) {
    const words = entry.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > 194 && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    entries.push(lines);
  }
  let total = entries.reduce((n, lines) => n + lines.length, 0);
  while (entries.length > 0 && total > 7) {
    total -= entries[0].length;
    entries.shift();
  }
  const visible = entries.flat();
  visible.forEach((line, i) => {
    ctx.fillText(line, 1038, 262 + i * 24);
  });
  ctx.restore();
}

function drawPlayerRow(ctx, game, now) {
  const p = game.player;
  // Energy pips.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd970';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('ENERGY', 40, 512);
  for (let i = 0; i < p.maxEnergy; i += 1) {
    ctx.beginPath();
    ctx.arc(52 + i * 30, 536, 11, 0, Math.PI * 2);
    ctx.fillStyle = i < p.energy ? '#ffd970' : 'rgba(255,217,112,0.25)';
    ctx.fill();
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = '#f5ead0';
  ctx.font = '17px Georgia, serif';
  ctx.fillText(`${p.energy} / ${p.maxEnergy}`, 52 + p.maxEnergy * 30 + 8, 537);
  ctx.restore();
  // Player hand.
  const spots = layoutHand(game);
  for (const spot of spots) {
    const affordable = spot.card.cost <= p.energy && game.phase === 'player';
    drawCard(ctx, spot.card, spot.x, spot.y, spot.w, spot.h, {
      dim: !affordable,
      selected: game.ui?.selected === spot.index,
      bonus: resonanceBonus(p, spot.card),
    });
  }
  // Player life bar, bottom left.
  drawLifeBar(ctx, 40, 724, 360, 26, p.life, p.maxLife, p.shield, 'YOU');
  // Deck count, tucked under the energy pips, clear of the hand.
  ctx.save();
  ctx.fillStyle = 'rgba(245,234,208,0.8)';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Deck: ${p.deck.length} cards`, 40, 580);
  ctx.restore();
  // End Turn button.
  const b = endTurnRect();
  ctx.save();
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = game.phase === 'player' ? '#c98f1b' : 'rgba(201,143,27,0.4)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffd970';
  ctx.stroke();
  ctx.fillStyle = '#fff8e8';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('END TURN', b.x + b.w / 2, b.y + b.h / 2 + 1);
  ctx.restore();
  // Score, top right.
  ctx.save();
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd970';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(`SCORE  ${game.score}`, CANVAS_WIDTH - 40, 52);
  ctx.fillStyle = 'rgba(245,234,208,0.85)';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`damage dealt ${game.stats.damageDealt}`, CANVAS_WIDTH - 40, 78);
  ctx.restore();
  // Hint line.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(245,234,208,0.75)';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('Click a card to select it, click again (or press Enter) to play · keys 1–7 select · E ends turn', CANVAS_WIDTH / 2, 786);
  ctx.restore();
}

function drawTitle(ctx, game) {
  drawTable(ctx, game);
  ctx.save();
  ctx.textAlign = 'center';
  // Sample cards fanned behind the title.
  const sample = [
    { id: 0, suit: 'ember', kind: 'strike', cost: 2, value: 5 },
    { id: 1, suit: 'tide', kind: 'spark', cost: 1, value: 2 },
    { id: 2, suit: 'grove', kind: 'guard', cost: 2, value: 5 },
    { id: 3, suit: 'stone', kind: 'mend', cost: 1, value: 3 },
  ];
  sample.forEach((card, i) => {
    ctx.save();
    ctx.translate(640 + (i - 1.5) * 150, 470);
    ctx.rotate((i - 1.5) * 0.07);
    drawCard(ctx, card, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, {});
    ctx.restore();
  });
  ctx.fillStyle = '#ffd970';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillText('EMBERFALL', 640, 170);
  ctx.fillStyle = '#f5ead0';
  ctx.font = 'italic 30px Georgia, serif';
  ctx.fillText('a duel of cinders and tides', 640, 218);
  ctx.font = '19px Georgia, serif';
  ctx.fillText('Outplay the Warden in a 1-v-1 card duel. Spend energy, play suits,', 640, 668);
  ctx.fillText('chain two cards of one suit for RESONANCE +2, and burn their 30 life to zero.', 640, 694);
  ctx.fillStyle = '#ffd970';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('CLICK OR PRESS ENTER TO BEGIN', 640, 748);
  ctx.restore();
}

function drawEndScreen(ctx, game, won) {
  drawTable(ctx, game);
  ctx.save();
  ctx.textAlign = 'center';
  if (won) {
    ctx.fillStyle = '#ffd970';
    ctx.font = 'bold 92px Georgia, serif';
    ctx.fillText('VICTORY!', 640, 220);
    ctx.fillStyle = '#f5ead0';
    ctx.font = 'italic 28px Georgia, serif';
    ctx.fillText('The Warden bows. The embers are yours.', 640, 272);
  } else {
    ctx.fillStyle = '#e2483d';
    ctx.font = 'bold 92px Georgia, serif';
    ctx.fillText('DEFEAT', 640, 220);
    ctx.fillStyle = '#f5ead0';
    ctx.font = 'italic 28px Georgia, serif';
    ctx.fillText('Your embers fade — but the duel can be fought again.', 640, 272);
  }
  // Final life bars.
  drawLifeBar(ctx, 300, 330, 340, 26, game.player.life, game.player.maxLife, game.player.shield, 'YOU');
  drawLifeBar(ctx, 640, 330, 340, 26, game.opponent.life, game.opponent.maxLife, game.opponent.shield, 'THE WARDEN');
  ctx.fillStyle = '#f5ead0';
  ctx.font = '22px Georgia, serif';
  ctx.fillText(`FINAL SCORE  ${game.score}`, 640, 440);
  ctx.font = '19px Georgia, serif';
  ctx.fillText(`Turns ${game.stats.turns}   ·   Cards played ${game.stats.cardsPlayed}   ·   Damage dealt ${game.stats.damageDealt}`, 640, 478);
  ctx.fillStyle = '#ffd970';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('PRESS R TO DUEL AGAIN', 640, 560);
  ctx.restore();
}

/** Draw the whole game for the current screen. `now` is a millisecond clock. */
export function render(ctx, game, now) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (game.screen === SCREEN_TITLE) {
    drawTitle(ctx, game);
  } else if (game.screen === SCREEN_WIN) {
    drawEndScreen(ctx, game, true);
  } else if (game.screen === SCREEN_LOSE) {
    drawEndScreen(ctx, game, false);
  } else {
    drawTable(ctx, game);
    drawOpponentRow(ctx, game);
    drawPlayedCards(ctx, game, now);
    drawLog(ctx, game);
    drawPlayerRow(ctx, game, now);
  }
}
