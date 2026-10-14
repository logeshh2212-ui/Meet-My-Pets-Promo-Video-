// Shared toolkit for the cinematic templates (title, hero, feature, lineup, logo):
//   - backdrop:  a dark studio with a soft key light and drifting out-of-focus lights (bokeh)
//   - kinetic type: words that rise from behind a mask, kicker labels, fading body text
//   - Phone3D:   a lit 3D phone (metal body, glass, glare) whose screen shows your screenshots,
//                with swipes between screens, scrolling, tap ripples and a card that lifts out
//   - stage:     a 3D scene with studio lighting and a camera
// Colours come from theme.json (palette.ts), fonts and easing from _launch.ts.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { fitSize, font, measure } from '../engine/type';
import { HEX, rgba } from '../engine/palette';
import { clamp, ease, lerp, prog } from '../engine/util';
import { displayFamily, drawPaw, labelFamily } from './_launch';

// ------------------------------------------------------------------ backdrop

/**
 * The studio background. Uniforms (set every frame): t = time (s), k = 0..1 brightness,
 * focus = where the key light pools (px, measured from the BOTTOM-left, as shaders count),
 * par = camera drift in px (the bokeh layers move against it at different speeds: depth),
 * bokeh = 0..1 amount of out-of-focus lights.
 */
export function makeBackdrop(): FSPass {
  return new FSPass(
    /* glsl */ `uniform float t, k, bokeh; uniform vec2 focus, par;
    float disc(vec2 p, vec2 c, float r) { return smoothstep(r, r * 0.55, length(p - c)); }
    void main() {
      vec2 p = FRAG_PX;
      vec3 col = C_INK;
      // the key light: a soft pool behind the subject
      vec2 q = (p - focus) / vec2(1000.0, 760.0);
      col += (C_INK2 * 1.8 + C_SIGNAL * 0.008) * exp(-dot(q, q) * 1.8) * k;
      // warm light spilling in from the top-right corner
      vec2 h = (p - vec2(1650.0, 1180.0)) / 900.0;
      col += C_SIGNAL * 0.022 * exp(-dot(h, h) * 1.5) * k;
      // the floor falls off into darkness
      col *= mix(0.55, 1.0, smoothstep(0.0, 500.0, p.y));
      // bokeh: three depth layers of soft lights drifting upward; nearer layers are bigger and move more
      for (int l = 0; l < 3; l++) {
        float fl = float(l);
        float cell = 260.0 - fl * 60.0;
        vec2 drift = vec2(0.0, t * (10.0 + fl * 8.0)) + par * (0.3 + fl * 0.35);
        vec2 id = floor((p - drift) / cell);
        vec2 r = hash22(id + fl * 17.0);
        if (r.x > 0.28) continue; // most cells stay empty
        vec2 c = (id + 0.2 + 0.6 * hash22(id * 1.7 + fl)) * cell + drift;
        float rad = cell * (0.08 + 0.12 * r.y);
        float twinkle = 0.6 + 0.4 * sin(t * (0.6 + r.y) + r.x * 40.0);
        col += mix(C_SIGNAL, C_BONE, r.y) * disc(p, c, rad) * 0.028 * twinkle * bokeh * k * (1.0 - fl * 0.2);
      }
      fragColor = vec4(col, 1.0);
    }`,
    { t: { value: 0 }, k: { value: 1 }, bokeh: { value: 1 }, focus: { value: [W / 2, H / 2] }, par: { value: [0, 0] } },
  );
}

/** Sets the backdrop's per-frame uniforms. `focusY` is measured from the TOP like Canvas2D (flipped here). */
export function updateBackdrop(bg: FSPass, t: number, k: number, focusX: number, focusY: number, par: [number, number] = [0, 0], bokeh = 1) {
  bg.u.t!.value = t;
  bg.u.k!.value = k;
  bg.u.bokeh!.value = bokeh;
  bg.u.focus!.value = [focusX, H - focusY];
  bg.u.par!.value = par;
}

// ------------------------------------------------------------------ kinetic type

export type Align = 'left' | 'center' | 'right';
const leftEdge = (x: number, w: number, align: Align) => (align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
/** Display type is set slightly tight, like premium brand type. */
const TRACK = -0.015;

export interface LineOpts {
  align?: Align;
  /** Word(s) drawn in the accent gradient. */
  accent?: string | string[];
  color?: string;
  /** Seconds between words, and each word's rise time. */
  stagger?: number;
  dur?: number;
  /** A soft dark shadow behind the letters, for text over photos. */
  shadow?: boolean;
  /** The accent gradient's two colours (default ACCENTS.photo). */
  accentColors?: readonly [string, string];
}

/**
 * Accent gradients that stay readable: "photo" (bright pink to gold) over photos and dark scenes,
 * "gold" (light gold) over the coral and orange brand colours, where pink would disappear.
 */
export const ACCENTS = { photo: ['#FF6A8A', '#FFC24D'], gold: ['#FFF1B5', '#FFC23D'] } as const;
export const accentColors = (style: unknown) => (style === 'gold' ? ACCENTS.gold : ACCENTS.photo);

/**
 * One line of display type whose words rise, one after another, from behind an invisible edge
 * (a mask: each word is clipped to its own line box, so it appears to slide out of a slot).
 * Starts at time t0 (scene-local seconds). Returns the line's width.
 */
/**
 * Which parts of each word are accented. An accent can be a whole word ("story."), a phrase of
 * several words ("world to meet.") or part of a word ("Pets." inside "MeetMyPets.").
 * Returns, per word, its pieces as [text, accented].
 */
function accentPieces(words: string[], accent: string | string[] | undefined): [string, boolean][][] {
  const pieces: [string, boolean][][] = words.map((w) => [[w, false]]);
  for (const a of Array.isArray(accent) ? accent : accent ? [accent] : []) {
    const aw = a.split(' ');
    let found = false;
    for (let i = 0; i + aw.length <= words.length; i++) {
      if (aw.every((w, j) => words[i + j] === w)) { aw.forEach((_, j) => { pieces[i + j] = [[words[i + j]!, true]]; }); found = true; }
    }
    if (found || aw.length > 1) continue;
    words.forEach((w, i) => { // part of a word
      const at = w.indexOf(a);
      if (at < 0 || pieces[i]!.length > 1) return;
      pieces[i] = ([[w.slice(0, at), false], [a, true], [w.slice(at + a.length), false]] as [string, boolean][]).filter(([t]) => t);
    });
  }
  return pieces;
}

/**
 * One line of display type whose words rise, one after another, from behind an invisible edge
 * (a mask: each word is clipped to its own line box, so it appears to slide out of a slot).
 * Starts at time t0 (scene-local seconds). Accented parts get the brand gradient. Returns the line's width.
 */
export function kineticLine(c: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, t: number, t0: number, o: LineOpts = {}): number {
  const fam = displayFamily(), track = TRACK * size;
  const words = text.split(' ');
  const pieces = accentPieces(words, o.accent);
  const space = measure(' ', fam, size);
  const widths = words.map((w) => measure(w, fam, size, track));
  const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  let wx = leftEdge(x, total, o.align ?? 'left');
  words.forEach((_, j) => {
    const w = widths[j]!;
    const s = t0 + j * (o.stagger ?? 0.07);
    const k = prog(t, s, s + (o.dur ?? 0.9), ease.outExpo);
    if (k > 0) {
      c.save();
      c.beginPath();
      c.rect(wx - size * 0.15, y - size * 1.05, w + size * 0.3, size * 1.4); // the word's slot
      c.clip();
      c.font = font(fam, size);
      c.letterSpacing = `${track}px`;
      c.globalAlpha = Math.min(1, k * 1.6);
      if (o.shadow) { c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = size * 0.35; }
      let px = wx;
      for (const [piece, accented] of pieces[j]!) {
        const pw = measure(piece, fam, size, track);
        if (accented) {
          const g = c.createLinearGradient(px, y - size, px + pw, y);
          const [c0, c1] = o.accentColors ?? ACCENTS.photo;
          g.addColorStop(0, c0);
          g.addColorStop(1, c1);
          c.fillStyle = g;
        } else c.fillStyle = rgba(o.color ?? 'bone');
        c.fillText(piece, px, y + (1 - k) * size * 1.15);
        px += pw + track; // the letter spacing between the last letter of a piece and the next
      }
      c.restore();
    }
    wx += w + space;
  });
  return total;
}

/** Several kinetic lines stacked (line height 1.05 em), each starting `gap` s after the previous. Returns the y below the block. */
export function kineticBlock(c: CanvasRenderingContext2D, lines: string[], x: number, y: number, size: number, t: number, t0: number, o: LineOpts & { gap?: number } = {}): number {
  lines.forEach((line, i) => kineticLine(c, line, x, y + i * size * 1.05, size, t, t0 + i * (o.gap ?? 0.18), o));
  return y + (lines.length - 1) * size * 1.05;
}

/** A small uppercase, widely spaced label above a headline ("PROFILES"), with a short accent rule that draws in. */
export function kicker(c: CanvasRenderingContext2D, text: string, x: number, y: number, t: number, t0: number, align: Align = 'left', color: string = rgba('signal')) {
  const k = prog(t, t0, t0 + 0.9, ease.outQuart);
  if (k <= 0) return;
  const size = 22, fam = labelFamily(), label = text.toUpperCase();
  const track = size * lerp(0.5, 0.3, k); // the letters close up as it appears
  const w = measure(label, fam, size, track);
  const rule = 40;
  c.save();
  c.globalAlpha = k;
  c.fillStyle = color;
  const total = align === 'center' ? w : rule + 16 + w;
  const x0 = leftEdge(x, total, align);
  if (align !== 'center') c.fillRect(x0, y - 8, rule * k, 2);
  c.font = font(fam, size);
  c.letterSpacing = `${track}px`;
  c.fillText(label, align === 'center' ? x0 : x0 + rule + 16, y);
  c.restore();
}

/** Splits text into lines no wider than maxW. */
export function wrapText(text: string, family: string, size: number, maxW: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(' ')) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && measure(next, family, size) > maxW) { lines.push(cur); cur = word; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Body text (wrapped to maxW) that fades up softly. */
export function bodyText(c: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxW: number, t: number, t0: number, align: Align = 'left', color = 'ash') {
  const k = prog(t, t0, t0 + 1.0, ease.outQuart);
  if (k <= 0) return;
  const fam = labelFamily();
  c.save();
  c.globalAlpha = k;
  c.font = font(fam, size);
  c.fillStyle = rgba(color);
  wrapText(text, fam, size, maxW).forEach((line, i) => {
    c.fillText(line, leftEdge(x, measure(line, fam, size), align), y + i * size * 1.45 + (1 - k) * 14);
  });
  c.restore();
}

/** The words of a shot, as the storyboard gives them. */
export interface Copy { kicker?: string; lines?: string[]; accent?: string | string[]; sub?: string }

/**
 * The text beside a phone: kicker, headline, body, vertically centred on the side away from the
 * phone (side 1 = phone right, text left; -1 = the reverse; 0 = phone centred, headline underneath).
 */
export function sideCopy(c: CanvasRenderingContext2D, copy: Copy, side: number, t: number, t0 = 0.5, size = 92) {
  const lines = copy.lines ?? [];
  if (side === 0) {
    if (lines[0]) kineticLine(c, lines.join(' '), W / 2, 1000, 56, t, t0, { align: 'center', accent: copy.accent });
    return;
  }
  const x = side > 0 ? 170 : W * 0.56;
  const blockH = Math.max(0, lines.length - 1) * size * 1.05 + (copy.sub ? 100 : 0);
  const y1 = H / 2 - blockH / 2 + size * 0.35;
  if (copy.kicker) kicker(c, copy.kicker, x, y1 - size - 18, t, t0 - 0.25);
  const yLast = kineticBlock(c, lines, x, y1, size, t, t0, { accent: copy.accent });
  if (copy.sub) bodyText(c, copy.sub, x, yLast + 78, 34, 640, t, t0 + 0.35 + lines.length * 0.18);
}

/**
 * Text opacity: 1 while the shot plays, easing to 0 over its last half second, so text leaves before
 * a fade, dip or flash. Before a whip or zoom (`exit`) it stays: the move carries it off screen.
 */
export const textOut = (lt: number, dur: number, exit?: unknown) =>
  exit === 'whip' || exit === 'zoom' ? 1 : 1 - prog(lt, dur - 0.6, dur - 0.15, ease.inCubic);

// ------------------------------------------------------------------ the phone's screen

/** Phone size in world units (a modern phone's proportions) and its screen (inside a thin bezel). */
export const PHONE_W = 0.72, PHONE_H = 1.5, PHONE_R = 0.115, PHONE_D = 0.05, BEVEL = 0.014;
export const SCREEN_IN = 0.03, SCREEN_W = PHONE_W - 2 * SCREEN_IN, SCREEN_H = PHONE_H - 2 * SCREEN_IN;
export const FRONT = PHONE_D / 2 + BEVEL; // z of the front face
/** Screen canvas resolution (px): the screen's aspect, sharp enough for a close-up. */
export const SCR_W = 600, SCR_H = Math.round((SCR_W * SCREEN_H) / SCREEN_W);

export interface Tap { t: number; x: number; y: number }
export interface ScreenOpts {
  /** Scene-local times at which to swipe to the next screen (default: evenly spread). */
  swapAt?: number[];
  /** 0..1: how far to scroll a screenshot taller than the screen, over the shot. */
  scroll?: number;
  /** Tap ripples: time (s) and position (0..1 of the screen width/height). */
  taps?: Tap[];
  /** Draw the camera cut-out (default true; screenshots cut from mock-ups already show one). */
  island?: boolean;
  /** Little hearts float up from every tap (a "like"). */
  burst?: boolean;
  /** A flick: at time t the content between `top` and `bottom` (0..1 of the screen) scrolls up by `amount` of the screen, looping. */
  flick?: { t: number; top: number; bottom: number; amount: number };
  /** A card swiped away at time t: `box` = [x, y, w, h] (0..1 of the screen); dir 1 = to the right (a like), -1 = left. */
  swipeCard?: { t: number; box: [number, number, number, number]; dir?: number };
}

/** Draws the phone's screen into a canvas each frame: screenshots (or placeholder app screens), swipes, scrolling, taps. */
export class ScreenPainter {
  canvas = document.createElement('canvas');
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  images: (HTMLImageElement | null)[] = [];

  constructor(public names: string[]) {
    this.canvas.width = SCR_W;
    this.canvas.height = SCR_H;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
  }

  async load() {
    this.images = await Promise.all(this.names.map((n) => loadImageQuiet(n)));
  }

  paint(lt: number, dur: number, o: ScreenOpts = {}) {
    const c = this.ctx, n = Math.max(1, this.names.length);
    // which screen is showing, and the swipe to the next one (an iOS-style push, 0.5 s)
    const swaps = o.swapAt ?? Array.from({ length: n - 1 }, (_, i) => 0.9 + ((dur - 1.6) * (i + 1)) / n);
    let idx = 0, swipe = 0;
    swaps.forEach((s, i) => { if (lt >= s) { idx = i + 1; swipe = 0; } else if (lt > s - 0.5 && idx === i) swipe = ease.inOutCubic((lt - (s - 0.5)) / 0.5); });
    idx = Math.min(idx, n - 1);
    const scrollK = (o.scroll ?? 0) * ease.inOutCubic(clamp(lt / Math.max(1, dur)));
    c.save();
    c.fillStyle = '#0B0B0D';
    c.fillRect(0, 0, SCR_W, SCR_H);
    // a flick: how far the scrolling part has moved (fast start, gentle stop, like a real fling)
    const flickOff = o.flick ? o.flick.amount * SCR_H * ease.outQuart(clamp((lt - o.flick.t) / 1.1)) : 0;
    this.drawScreen(idx, -swipe * SCR_W * 0.3, scrollK, 1 - swipe * 0.4, lt, o.flick, flickOff);
    if (swipe > 0 && idx + 1 < n) {
      c.shadowColor = 'rgba(0,0,0,0.5)';
      c.shadowBlur = 40;
      this.drawScreen(idx + 1, (1 - swipe) * SCR_W, 0, 1, lt);
      c.shadowBlur = 0;
    }
    if (o.swipeCard) this.swipeCard(lt, o.swipeCard);
    // tap ripples: a soft press and a ring that spreads
    for (const tap of o.taps ?? []) {
      const k = (lt - tap.t) / 0.6;
      if (k < 0 || k > 1) continue;
      const x = tap.x * SCR_W, y = tap.y * SCR_H;
      c.fillStyle = `rgba(255,255,255,${0.22 * (1 - k)})`;
      c.beginPath(); c.arc(x, y, 34, 0, Math.PI * 2); c.fill();
      c.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`;
      c.lineWidth = 3;
      c.beginPath(); c.arc(x, y, 34 + 70 * ease.outQuart(k), 0, Math.PI * 2); c.stroke();
    }
    // a like: six little hearts float up from the tap, drifting and fading
    if (o.burst) for (const tap of o.taps ?? []) {
      const k = (lt - tap.t) / 1.2;
      if (k < 0 || k > 1) continue;
      for (let i = 0; i < 6; i++) {
        const sx = Math.sin(i * 12.9898) * 0.5, sp = 0.7 + 0.3 * Math.abs(Math.sin(i * 78.233));
        const x = tap.x * SCR_W + sx * 120 * k + Math.sin(k * 6 + i) * 12, y = tap.y * SCR_H - 260 * sp * ease.outQuart(k);
        c.globalAlpha = (1 - k) * Math.min(1, k * 6);
        drawHeartLoop(c, x, y, 34 + 14 * sp, i % 2 ? rgba('signal') : rgba('ember'));
      }
      c.globalAlpha = 1;
    }
    // the camera cut-out (a real screenshot has the status bar but not this black pill)
    if (o.island !== false) {
      c.fillStyle = '#000';
      c.beginPath(); c.roundRect(SCR_W / 2 - 62, 22, 124, 36, 18); c.fill();
    }
    c.restore();
    this.texture.needsUpdate = true;
  }

  private card: HTMLCanvasElement | null = null;

  private drawScreen(i: number, dx: number, scrollK: number, bright: number, lt: number, flick?: ScreenOpts['flick'], flickOff = 0) {
    const c = this.ctx, img = this.images[i];
    c.save();
    c.translate(dx, 0);
    if (img) {
      // fit the width; a taller screenshot can scroll
      const s = SCR_W / img.naturalWidth, h = img.naturalHeight * s;
      c.drawImage(img, 0, -Math.max(0, h - SCR_H) * scrollK, SCR_W, h);
      if (flick && flickOff > 0) {
        // the scrolling band, moved up and repeated below itself so the feed seems to go on
        const y0 = flick.top * SCR_H, bh = (flick.bottom - flick.top) * SCR_H, sy = flick.top * img.naturalHeight, sh = (flick.bottom - flick.top) * img.naturalHeight;
        const off = flickOff % bh;
        c.save();
        c.beginPath(); c.rect(0, y0, SCR_W, bh); c.clip();
        c.drawImage(img, 0, sy, img.naturalWidth, sh, 0, y0 - off, SCR_W, bh);
        c.drawImage(img, 0, sy, img.naturalWidth, sh, 0, y0 - off + bh, SCR_W, bh);
        c.restore();
      }
    } else placeholderScreen(c, this.names[i] ?? '', scrollK, lt);
    if (bright < 1) { c.fillStyle = `rgba(0,0,0,${1 - bright})`; c.fillRect(0, 0, SCR_W, SCR_H); }
    c.restore();
  }

  /**
   * A card flying off the screen (a swipe), Tinder-style: the card tilts and slides out, and the
   * next card behind it (here: the same picture, dimmed and smaller) grows into its place.
   */
  private swipeCard(lt: number, o: NonNullable<ScreenOpts['swipeCard']>) {
    const c = this.ctx;
    const k = ease.inCubic(clamp((lt - o.t) / 0.55));
    if (lt < o.t) return;
    const [bx, by, bw, bh] = o.box, x = bx * SCR_W, y = by * SCR_H, w = bw * SCR_W, h = bh * SCR_H;
    if (!this.card) { this.card = document.createElement('canvas'); this.card.width = SCR_W; this.card.height = SCR_H; }
    const cc = this.card.getContext('2d')!;
    cc.clearRect(0, 0, SCR_W, SCR_H);
    cc.drawImage(this.canvas, x, y, w, h, 0, 0, w, h); // the card as it is now
    // the next card behind: grows from 92% as the first one leaves
    const g = 0.92 + 0.08 * ease.outQuart(clamp((lt - o.t - 0.35) / 0.5));
    c.save();
    c.fillStyle = '#F4F2F2';
    c.fillRect(x, y, w, h);
    c.translate(x + w / 2, y + h / 2); c.scale(g, g);
    c.globalAlpha = 0.55 + 0.45 * clamp((lt - o.t - 0.35) / 0.5);
    c.drawImage(this.card, 0, 0, w, h, -w / 2, -h / 2, w, h);
    c.restore();
    if (k >= 1) return;
    // the leaving card: pivots about a point below it and slides off
    const dir = o.dir ?? 1;
    c.save();
    c.translate(x + w / 2 + dir * k * SCR_W * 1.1, y + h * 1.3);
    c.rotate(dir * k * 0.45);
    c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 30;
    c.drawImage(this.card, 0, 0, w, h, -w / 2, -h * 1.3, w, h);
    c.restore();
  }
}

/** Like loadImage in _launch.ts, but without a console error when the file isn't there yet. */
export async function loadImageQuiet(src: string): Promise<HTMLImageElement | null> {
  try {
    const r = await fetch(src, { method: 'HEAD' });
    if (!r.ok || !(r.headers.get('content-type') ?? '').startsWith('image/')) return null;
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
  } catch { return null; }
}

// ------------------------------------------------------------------ placeholder app screens
// Shown until your screenshots are in app/public/assets/. The file name picks the look:
// "discover", "match", "home", "profile", "remind…", "health"; anything else gets a generic screen.

const PETS = [['Luna', 'Golden Retriever'], ['Milo', 'Tabby cat'], ['Coco', 'French Bulldog']] as const;

/** A round pet photo stand-in: a warm gradient with a paw. */
function petAvatar(c: CanvasRenderingContext2D, x: number, y: number, r: number, hue = 0) {
  const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, hue ? '#FFD38A' : rgba('ember'));
  g.addColorStop(1, hue ? '#C77B3A' : rgba('blood'));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  drawPaw(c, x, y + r * 0.05, r * 1.1, 'rgba(255,255,255,0.92)');
}

/** The MeetMyPets "Discover" feed: a light UI with stories, a big pet card and a tab bar. */
function discoverScreen(c: CanvasRenderingContext2D) {
  const lab = labelFamily(), disp = displayFamily();
  const text = (s: string, x: number, y: number, size: number, color: string, fam = lab) => { c.font = font(fam, size); c.fillStyle = color; c.fillText(s, x, y); };
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, SCR_W, SCR_H);
  text('9:41', 48, 48, 22, '#111');
  text('MeetMyPets', 36, 140, 40, rgba('signal'), disp);
  // stories row: the first is the "Discover" button, the last adds a pet
  ['Discover', 'Shiro', 'Lay', 'Buddy', 'Add pet'].forEach((name, i) => {
    const x = 78 + i * 112, y = 215;
    if (i === 0) { c.fillStyle = rgba('signal'); c.beginPath(); c.arc(x, y, 44, 0, Math.PI * 2); c.fill(); drawHeartLoop(c, x, y, 40, '#FFFFFF'); }
    else if (i === 4) { c.strokeStyle = '#C8C8CC'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 42, 0, Math.PI * 2); c.stroke(); text('+', x - 11, y + 13, 40, '#8E8E93'); }
    else petAvatar(c, x, y, 42, i % 2);
    c.font = font(lab, 18);
    text(name, x - measure(name, lab, 18) / 2, y + 74, 18, i === 0 ? rgba('signal') : '#555');
  });
  // the big card: a photo stand-in, the pet's name over it, then the post line
  c.save();
  c.beginPath(); c.roundRect(30, 330, SCR_W - 60, 560, 36); c.clip();
  const g = c.createLinearGradient(0, 330, 0, 890);
  g.addColorStop(0, '#9CC27A'); g.addColorStop(0.55, '#E2B66B'); g.addColorStop(1, '#8A5A2B');
  c.fillStyle = g; c.fillRect(30, 330, SCR_W - 60, 560);
  drawPaw(c, SCR_W / 2, 570, 220, 'rgba(255,255,255,0.55)');
  const shade = c.createLinearGradient(0, 720, 0, 890);
  shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,0.55)');
  c.fillStyle = shade; c.fillRect(30, 720, SCR_W - 60, 170);
  text('Max', 64, 820, 48, '#FFFFFF', disp);
  text('Bengaluru · 1.2 km away', 64, 858, 22, 'rgba(255,255,255,0.85)');
  c.restore();
  petAvatar(c, 70, 950, 26, 1);
  text('Good vibes, great walks', 110, 960, 24, '#333');
  drawHeartLoop(c, SCR_W - 120, 950, 30, rgba('signal'));
  text('1.2k', SCR_W - 90, 960, 22, '#333');
  // tab bar
  c.fillStyle = '#F2F2F4'; c.fillRect(0, SCR_H - 130, SCR_W, 130);
  ['Discover', 'Chat', 'Create', 'Profile'].forEach((name, i) => {
    const x = 75 + i * 150, col = i === 0 ? rgba('signal') : '#8E8E93';
    c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(x, SCR_H - 85, 16, 0, Math.PI * 2); c.stroke();
    text(name, x - measure(name, lab, 18) / 2, SCR_H - 40, 18, col);
  });
}

/** The "It's a Match!" screen, animated: the two pets slide together, the heart pops, the button appears. */
function matchScreen(c: CanvasRenderingContext2D, lt: number) {
  const lab = labelFamily(), disp = displayFamily();
  const text = (s: string, y: number, size: number, color: string, fam = lab) => { c.font = font(fam, size); c.fillStyle = color; c.fillText(s, SCR_W / 2 - measure(s, fam, size) / 2, y); };
  c.fillStyle = '#0E0E10'; c.fillRect(0, 0, SCR_W, SCR_H);
  const glow = c.createRadialGradient(SCR_W / 2, 640, 0, SCR_W / 2, 640, 420);
  glow.addColorStop(0, rgba('signal', 0.35)); glow.addColorStop(1, rgba('signal', 0));
  c.fillStyle = glow; c.fillRect(0, 0, SCR_W, SCR_H);
  c.font = font(lab, 22); c.fillStyle = '#FFF'; c.fillText('9:41', 48, 48);
  const kt = prog(lt, 0.2, 0.9, ease.outQuart);
  c.globalAlpha = kt;
  text('It’s a Match!', 330 + (1 - kt) * 20, 56, '#FFFFFF', disp);
  text('The vibe is mutual.', 382, 26, '#B8B8BE');
  c.globalAlpha = 1;
  // the two pets slide in from the edges and meet in the middle
  const k = prog(lt, 0.4, 1.4, ease.outExpo);
  for (const [side, name] of [[-1, 'Max'], [1, 'Buddy']] as const) {
    const x = SCR_W / 2 + side * lerp(420, 150, k), y = 640;
    c.save();
    c.shadowColor = rgba('signal', 0.8); c.shadowBlur = 40;
    c.strokeStyle = rgba('signal'); c.lineWidth = 6;
    c.beginPath(); c.arc(x, y, 124, 0, Math.PI * 2); c.stroke();
    c.restore();
    petAvatar(c, x, y, 116, side > 0 ? 1 : 0);
    c.font = font(lab, 26); c.fillStyle = '#FFF'; c.fillText(name, x - measure(name, lab, 26) / 2, y + 170);
  }
  // the heart pops between them, then beats gently
  const kh = prog(lt, 1.2, 1.7, (x) => ease.outBack(x));
  if (kh > 0) drawHeartLoop(c, SCR_W / 2, 640, 70 * kh * (1 + 0.06 * Math.sin(lt * 7)), rgba('ember'));
  const kb = prog(lt, 1.6, 2.2, ease.outQuart);
  c.globalAlpha = kb;
  c.fillStyle = rgba('signal');
  c.beginPath(); c.roundRect(SCR_W / 2 - 190, 900 + (1 - kb) * 30, 380, 84, 42); c.fill();
  text('Send a message', 952 + (1 - kb) * 30, 30, '#FFFFFF');
  c.globalAlpha = 1;
}

function placeholderScreen(c: CanvasRenderingContext2D, name: string, scrollK: number, lt: number) {
  const lab = labelFamily(), disp = displayFamily(), n = name.toLowerCase();
  if (n.includes('discover')) return discoverScreen(c);
  if (n.includes('match')) return matchScreen(c, lt);
  c.fillStyle = '#0B0B0D';
  c.fillRect(0, 0, SCR_W, SCR_H);
  c.fillStyle = rgba('bone');
  c.font = font(lab, 22);
  c.fillText('9:41', 48, 48);
  c.fillRect(SCR_W - 82, 34, 36, 16); // battery
  c.save();
  c.translate(0, -scrollK * 300);
  const card = (x: number, y: number, w: number, h: number) => { c.fillStyle = '#1C1C1E'; c.beginPath(); c.roundRect(x, y, w, h, 28); c.fill(); };
  const avatar = (x: number, y: number, r: number) => {
    const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, rgba('ember')); g.addColorStop(1, rgba('signal'));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    drawPaw(c, x, y + r * 0.05, r * 1.1, 'rgba(255,255,255,0.92)');
  };
  const text = (s: string, x: number, y: number, size: number, color = 'bone', fam = lab) => { c.font = font(fam, size); c.fillStyle = rgba(color); c.fillText(s, x, y); };
  const bar = (x: number, y: number, w: number, color = 'graphite') => { c.fillStyle = rgba(color); c.beginPath(); c.roundRect(x, y, w, 12, 6); c.fill(); };

  if (n.includes('profile')) {
    avatar(SCR_W / 2, 260, 110);
    text('Luna', SCR_W / 2 - measure('Luna', disp, 56) / 2, 440, 56, 'bone', disp);
    const sub = 'Golden Retriever · 3 yrs';
    text(sub, SCR_W / 2 - measure(sub, lab, 24) / 2, 482, 24, 'ash');
    [['24 kg', 'Weight'], ['3 yrs', 'Age'], ['12', 'Walks']].forEach(([v, l], i) => {
      const x = 40 + i * 180; card(x, 530, 160, 130);
      text(v!, x + 24, 590, 34, 'bone', disp); text(l!, x + 24, 630, 20, 'ash');
    });
    card(40, 690, SCR_W - 80, 200); text('Favourite things', 72, 740, 26); bar(72, 775, 300); bar(72, 805, 380); bar(72, 835, 240);
    card(40, 910, SCR_W - 80, 200); text('Vet', 72, 960, 26); bar(72, 995, 260, 'signal'); bar(72, 1025, 340);
  } else if (n.includes('remind')) {
    text('Today', 40, 150, 60, 'bone', disp);
    text('4 reminders', 40, 195, 24, 'ash');
    [['8:00', 'Morning walk', 'Luna'], ['9:30', 'Breakfast', 'Milo'], ['13:00', 'Vet check-up', 'Coco'], ['18:30', 'Evening walk', 'Luna'], ['20:00', 'Medication', 'Milo']].forEach(([time, what, who], i) => {
      const y = 240 + i * 150; card(40, y, SCR_W - 80, 130);
      c.fillStyle = i === 0 ? rgba('signal') : rgba('graphite'); c.beginPath(); c.arc(100, y + 65, 22, 0, Math.PI * 2); c.fill();
      text(what!, 148, y + 58, 30); text(`${time} · ${who}`, 148, y + 96, 22, 'ash');
    });
  } else if (n.includes('health')) {
    text('Health', 40, 150, 60, 'bone', disp);
    text('Luna · last 6 months', 40, 195, 24, 'ash');
    card(40, 240, SCR_W - 80, 330); text('Weight', 72, 290, 26);
    [0.55, 0.62, 0.58, 0.7, 0.74, 0.8].forEach((v, i) => {
      c.fillStyle = i === 5 ? rgba('signal') : rgba('graphite');
      c.beginPath(); c.roundRect(80 + i * 78, 540 - v * 210, 44, v * 210, 10); c.fill();
    });
    [['Rabies vaccine', 'Up to date'], ['Deworming', 'Due in 12 days'], ['Dental check', 'Booked 14 Nov']].forEach(([a, b], i) => {
      const y = 600 + i * 140; card(40, y, SCR_W - 80, 120); text(a!, 72, y + 52, 28); text(b!, 72, y + 88, 22, i === 1 ? 'signal' : 'ash');
    });
  } else {
    text('My Pets', 40, 150, 60, 'bone', disp);
    text('Good morning!', 40, 195, 24, 'ash');
    PETS.forEach(([pet, breed], i) => {
      const y = 240 + i * 190; card(40, y, SCR_W - 80, 170);
      avatar(125, y + 85, 55);
      text(pet, 210, y + 75, 34); text(breed, 210, y + 115, 22, 'ash');
    });
    card(40, 820, SCR_W - 80, 150); text('Next: Morning walk', 72, 880, 28); text('8:00 · Luna', 72, 920, 22, 'signal');
  }
  c.restore();
}

// ------------------------------------------------------------------ the 3D phone

/** A rounded rectangle outline, centred on the origin. */
function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** A flat rounded rectangle whose texture spans it exactly (0..1 across, 0..1 up). */
function panel(w: number, h: number, r: number): THREE.ShapeGeometry {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 24);
  const pos = g.attributes.position!, uv = g.attributes.uv!;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
  return g;
}

/** A canvas texture of a soft shape: `draw` paints it in a size x size canvas. */
function softTexture(size: number, draw: (c: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A focus region of the screen (0..1 of its width/height from the top-left): the part that lifts out. */
export type Focus = [x: number, y: number, w: number, h: number];

export class Phone3D {
  group = new THREE.Group();
  screen: ScreenPainter;
  private glare: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;
  private pop: { mesh: THREE.Mesh; shadow: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>; canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; focus: Focus } | null = null;

  constructor(screens: string[]) {
    this.screen = new ScreenPainter(screens.length ? screens : ['home']);
    // body: a rounded slab of dark brushed metal with softly bevelled edges
    const body = new THREE.ExtrudeGeometry(roundedRect(PHONE_W - 2 * BEVEL, PHONE_H - 2 * BEVEL, PHONE_R - BEVEL), {
      depth: PHONE_D, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 6, curveSegments: 32,
    });
    body.translate(0, 0, -PHONE_D / 2);
    const metal = new THREE.MeshPhysicalMaterial({ color: 0x2b2b30, metalness: 0.85, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.25 });
    this.group.add(new THREE.Mesh(body, metal));
    // side buttons
    for (const [x, y, h] of [[-1, 0.42, 0.07], [-1, 0.28, 0.14], [-1, 0.1, 0.14], [1, 0.3, 0.22]] as const) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.012, h, 0.02), metal);
      b.position.set(x * (PHONE_W / 2 + 0.003), y, 0);
      this.group.add(b);
    }
    // the black glass front, then the screen just above it, then a faint moving glare on top
    const glass = new THREE.Mesh(panel(PHONE_W - 0.004, PHONE_H - 0.004, PHONE_R - 0.002), new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.08, clearcoat: 1 }));
    glass.position.z = FRONT + 0.0005;
    const screen = new THREE.Mesh(panel(SCREEN_W, SCREEN_H, PHONE_R - SCREEN_IN), new THREE.MeshBasicMaterial({ map: this.screen.texture, toneMapped: false }));
    screen.position.z = FRONT + 0.001;
    const glareTex = softTexture(512, (c) => {
      const g = c.createLinearGradient(0, 0, 512, 512);
      g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(0.65, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, 512, 512);
    });
    glareTex.repeat.set(0.5, 1);
    this.glare = new THREE.Mesh(panel(SCREEN_W, SCREEN_H, PHONE_R - SCREEN_IN), new THREE.MeshBasicMaterial({ map: glareTex, transparent: true, opacity: 0.03, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.glare.position.z = FRONT + 0.0015;
    this.group.add(glass, screen, this.glare);
  }

  load() { return this.screen.load(); }

  /** Prepares the card that lifts out of the screen (call once, in init). */
  makePop(focus: Focus) {
    const [, , fw, fh] = focus;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(fw * SCR_W); canvas.height = Math.round(fh * SCR_H);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const w = fw * SCREEN_W, h = fh * SCREEN_H, r = Math.min(w, h) * 0.12;
    const mesh = new THREE.Mesh(panel(w, h, r), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    const shadowTex = softTexture(256, (c) => { c.filter = 'blur(24px)'; c.fillStyle = 'rgba(0,0,0,1)'; c.fillRect(48, 48, 160, 160); });
    const shadow = new THREE.Mesh(panel(w * 1.5, h * 1.6, 0.001), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0, depthWrite: false }));
    this.group.add(shadow, mesh);
    this.pop = { mesh, shadow, canvas, tex, focus };
  }

  /**
   * Per frame: paints the screen and places the pop-out card. `popK` 0..1 = how far the card has
   * lifted (0 = flat in the screen, hidden). `turn` = the phone's Y rotation, which moves the glare.
   */
  update(lt: number, dur: number, opts: ScreenOpts, popK = 0, turn = 0) {
    this.screen.paint(lt, dur, opts);
    (this.glare.material.map as THREE.Texture).offset.x = clamp(0.25 - turn * 0.6, 0, 0.5);
    if (!this.pop) return;
    const { mesh, shadow, canvas, tex, focus: [fx, fy, fw, fh] } = this.pop;
    // copy the region before darkening it on the screen: the card carries the bright original
    canvas.getContext('2d')!.drawImage(this.screen.canvas, fx * SCR_W, fy * SCR_H, fw * SCR_W, fh * SCR_H, 0, 0, canvas.width, canvas.height);
    tex.needsUpdate = true;
    if (popK > 0) {
      const sc = this.screen.ctx;
      sc.fillStyle = `rgba(0,0,0,${0.55 * popK})`;
      sc.fillRect(0, 0, SCR_W, SCR_H); // the rest of the screen dims, so the card stands out
    }
    const cx = (fx + fw / 2 - 0.5) * SCREEN_W, cy = (0.5 - fy - fh / 2) * SCREEN_H;
    mesh.visible = popK > 0.001;
    mesh.position.set(cx, cy, FRONT + 0.002 + 0.3 * popK);
    mesh.scale.setScalar(1 + 0.14 * popK);
    shadow.position.set(cx + 0.03 * popK, cy - 0.05 * popK, FRONT + 0.0018);
    shadow.material.opacity = 0.75 * popK;
  }
}

// ------------------------------------------------------------------ stage: lights and camera

let envMap: THREE.Texture | null = null;

/** A 3D scene lit like a product shot: soft room reflections, a key light, an accent rim light behind. */
export function makeStage(renderer: THREE.WebGLRenderer) {
  if (!envMap) {
    const pm = new THREE.PMREMGenerator(renderer);
    envMap = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
  }
  const scene = new THREE.Scene();
  scene.environment = envMap;
  scene.environmentIntensity = 0.35;
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-2, 3, 4);
  const rim = new THREE.DirectionalLight(new THREE.Color(HEX.signal), 5);
  rim.position.set(3, 1.5, -3);
  const back = new THREE.DirectionalLight(0xffffff, 1.5);
  back.position.set(-3, -1, -2);
  scene.add(key, rim, back);
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 50);
  return { scene, cam, rim };
}

/** Renders a stage over what is already in `out` (the backdrop), keeping the backdrop. */
export function renderStage(renderer: THREE.WebGLRenderer, scene: THREE.Scene, cam: THREE.Camera, out: THREE.WebGLRenderTarget) {
  renderer.setRenderTarget(out);
  renderer.clearDepth();
  renderer.render(scene, cam);
}

// ------------------------------------------------------------------ camera moves

export type Move = 'reveal' | 'orbit' | 'rise' | 'push' | 'float';
export interface Pose { x: number; y: number; rx: number; ry: number; rz: number; camZ: number; camY: number }

/**
 * Where the phone is and how it is turned at scene-local time lt (p = 0..1 through the shot).
 * `side` -1 / 0 / 1 puts the phone left / centre / right, turned toward the middle of the frame.
 */
export function phonePose(move: Move, lt: number, p: number, side: number): Pose {
  const enter = ease.outExpo(clamp((lt - 0.05) / 1.6));
  const glide = ease.inOutCubic(clamp(p));
  const pose: Pose = { x: side * 0.78, y: 0, rx: 0.04, ry: -side * 0.22, rz: 0, camZ: 4.2, camY: 0 };
  switch (move) {
    case 'reveal': // turns from edge-on into the light
      pose.ry += lerp(-1.3, -0.05, enter) - 0.08 * glide;
      pose.y = lerp(-0.25, 0, enter);
      pose.camZ = lerp(5.0, 4.1, glide);
      break;
    case 'orbit': // the camera circles slowly around it
      pose.ry += lerp(0.4, -0.4, glide);
      pose.rx = 0.07;
      pose.camZ = lerp(4.3, 4.0, glide);
      break;
    case 'rise': // rises out of the dark, tipping up to face us
      pose.y = lerp(-2.4, 0, enter);
      pose.rx = lerp(0.65, 0.04, enter);
      pose.camZ = lerp(4.4, 4.1, glide);
      break;
    case 'push': // the camera pushes in toward the screen (a phone at the side drifts inward so it stays in frame)
      pose.ry *= 1 - glide * 0.7;
      pose.x *= 1 - 0.3 * glide;
      pose.camZ = lerp(4.6, 3.3, glide);
      pose.camY = lerp(0, 0.1, glide);
      break;
    case 'float':
      break;
  }
  // always a gentle hover, so the frame never feels frozen
  pose.y += Math.sin(lt * 1.1) * 0.015;
  pose.rz += Math.sin(lt * 0.7) * 0.01;
  pose.ry += Math.sin(lt * 0.5) * 0.02;
  return pose;
}

/** Applies a pose to a phone and the camera. */
export function applyPose(phone: Phone3D, cam: THREE.PerspectiveCamera, pose: Pose) {
  phone.group.position.set(pose.x, pose.y, 0);
  phone.group.rotation.set(pose.rx, pose.ry, pose.rz);
  cam.position.set(0, pose.camY, pose.camZ);
  cam.lookAt(0, pose.camY * 0.5, 0);
}

/** The storyboard's "side" ("left" / "center" / "right", default right) as -1 / 0 / 1. */
export const sideOf = (s: unknown): number => (s === 'left' ? -1 : s === 'center' ? 0 : 1);

// ------------------------------------------------------------------ brand pieces

/**
 * The MeetMyPets heart-loop mark drawn in code (used until assets/logo.png exists): two loops
 * leaning into each other so their bottoms meet in a point, like a heart drawn in one stroke.
 * `s` = overall size in px; `color` = a CSS colour or gradient.
 */
export function drawHeartLoop(c: CanvasRenderingContext2D, x: number, y: number, s: number, color: string | CanvasGradient) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = s * 0.1;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.ellipse(x + side * s * 0.17, y - s * 0.04, s * 0.24, s * 0.4, side * 0.5, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

/** A gold-to-orange gradient across a box, for the logo on the coral background. */
export function goldGradient(c: CanvasRenderingContext2D, x: number, y: number, s: number): CanvasGradient {
  const g = c.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2);
  g.addColorStop(0, rgba('ember'));
  g.addColorStop(1, rgba('blood'));
  return g;
}

/**
 * The brand background: a coral-to-orange gradient with a soft highlight, and flowing ribbons
 * (`count` thin glowing strands that wave slowly). `k` 0..1 draws the ribbons in from the left.
 */
export function brandBackground(c: CanvasRenderingContext2D, t: number, k: number, baseY = H * 0.74, count = 7) {
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#E8194F');
  g.addColorStop(0.55, rgba('signal'));
  g.addColorStop(1, rgba('blood'));
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  const hi = c.createRadialGradient(W * 0.35, H * 0.3, 0, W * 0.35, H * 0.3, W * 0.6);
  hi.addColorStop(0, 'rgba(255,255,255,0.16)');
  hi.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hi;
  c.fillRect(0, 0, W, H);
  if (k <= 0) return;
  c.save();
  c.beginPath(); c.rect(0, 0, W * k + 40, H); c.clip(); // the reveal
  c.shadowColor = rgba('ember', 0.8);
  c.shadowBlur = 16;
  const rib = c.createLinearGradient(0, 0, W, 0);
  rib.addColorStop(0, rgba('ember')); rib.addColorStop(0.5, rgba('blood')); rib.addColorStop(1, rgba('ember'));
  c.strokeStyle = rib;
  for (let i = 0; i < count; i++) {
    c.lineWidth = i % 3 === 0 ? 5 : 2.5;
    c.globalAlpha = 0.55 + 0.45 * ((i * 37) % 7) / 7;
    c.beginPath();
    for (let x = -60; x <= W + 60; x += 30) {
      const y = baseY + i * 13 + 90 * Math.sin(x * 0.0032 + t * 0.5 + i * 0.12) - 140 * Math.sin(x * 0.0012 - t * 0.15) * (x / W);
      if (x === -60) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
  }
  c.restore();
}

export interface PhotoOpts {
  /** "cover" fills the frame (cropping what doesn't fit); "height" shows the photo's full height on one part of the frame. */
  fit?: 'cover' | 'height';
  /** The point of the photo (0..1 of its width and height) kept in view when cropping. Default the centre. */
  anchor?: [number, number];
  /** fit "height": where the photo's centre sits across the frame, 0..1 (default 0.72: right of centre). */
  at?: number;
  /** fit "height": what fills the rest of the frame: the photo's own blurred copy, or the brand gradient. */
  fill?: 'blur' | 'brand';
  /** "multiply" lays the photo over the fill like ink, so a white background disappears (product shots on white). */
  blend?: 'normal' | 'multiply';
  /** Extra size on top of the fit (1.4 = 40% bigger, cropping more; 0.9 = smaller, showing margins). */
  scale?: number;
}

/**
 * A photo on its own 2D layer, moved by a zoom and a pan each frame. It can fill the frame
 * (cropping around a focus point) or stand at full height on one side with a blurred copy or the
 * brand gradient around it. With `blur` > 0 it is a soft background (blurred once at load).
 * Missing file: a dark warm placeholder that names the file it is waiting for.
 */
export class PhotoLayer {
  layer = new Layer2D();
  img: HTMLImageElement | null = null;
  /** Where the photo was last drawn: frame px = (x0 + u * w, y0 + v * h) for a point (u, v) of the photo. */
  placed = { x0: 0, y0: 0, w: W, h: H };
  private soft: HTMLCanvasElement | null = null;
  private feathered: HTMLCanvasElement | null = null;

  constructor(public src: string, public o: PhotoOpts = {}) {}

  async load(blur = 0) {
    this.img = await loadImageQuiet(this.src);
    const img = this.img;
    if (!img) return;
    const [ax, ay] = this.o.anchor ?? [0.5, 0.5];
    const height = this.o.fit === 'height';
    if (blur > 0 || (height && this.o.fill !== 'brand')) {
      // a blurred copy filling the frame (blurring every frame would be slow), 10% oversized so its soft edges stay off screen
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const c = cv.getContext('2d')!;
      c.filter = `blur(${blur || 40}px)`;
      const s = 1.1 * Math.max(W / img.naturalWidth, H / img.naturalHeight);
      c.drawImage(img, W / 2 - ax * img.naturalWidth * s, H / 2 - ay * img.naturalHeight * s, img.naturalWidth * s, img.naturalHeight * s);
      this.soft = cv;
    }
    if (height && this.o.fill !== 'brand') {
      // the sharp photo with its left and right edges faded out, so it melts into the blurred copy
      const h = Math.min(img.naturalHeight, 2 * H), w = Math.round((img.naturalWidth * h) / img.naturalHeight);
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const c = cv.getContext('2d')!;
      c.drawImage(img, 0, 0, w, h);
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.14, 'rgba(0,0,0,1)'); g.addColorStop(0.86, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'destination-in';
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      this.feathered = cv;
    }
  }

  /** Where the photo goes this frame at `zoom` (1 = its fitted size) shifted by panX/panY px. */
  private place(zoom: number, panX: number, panY: number) {
    const img = this.img!, iw = img.naturalWidth, ih = img.naturalHeight;
    const [ax, ay] = this.o.anchor ?? [0.5, 0.5];
    zoom *= this.o.scale ?? 1;
    if (this.o.fit === 'height') {
      const s = (H / ih) * zoom;
      // scaled up past the frame's height, the focus point's height stays centred (without uncovering the edges)
      const y0 = s * ih > H ? clamp(H / 2 + panY - ay * ih * s, H - ih * s, 0) : H / 2 + panY - (ih * s) / 2;
      return { x0: W * (this.o.at ?? 0.72) + panX - (iw * s) / 2, y0, w: iw * s, h: ih * s };
    }
    const s = Math.max(W / iw, H / ih) * zoom;
    // keep the focus point centred, but never uncover the frame's edges
    const x0 = clamp(W / 2 + panX - ax * iw * s, W - iw * s, 0);
    const y0 = clamp(H / 2 + panY - ay * ih * s, H - ih * s, 0);
    return { x0, y0, w: iw * s, h: ih * s };
  }

  /** Where point (u, v) of the photo WOULD be drawn with options `o` at `zoom` (nothing is drawn). */
  probe(o: PhotoOpts, zoom: number, u: number, v: number): [number, number] {
    if (!this.img) return [u * W, v * H];
    const keep = this.o;
    this.o = o;
    const pl = this.place(zoom, 0, 0);
    this.o = keep;
    return [pl.x0 + u * pl.w, pl.y0 + v * pl.h];
  }

  /** Frame position (px, from the top-left) of a point (u, v) of the photo, as last drawn. */
  toFrame(u: number, v: number): [number, number] {
    return [this.placed.x0 + u * this.placed.w, this.placed.y0 + v * this.placed.h];
  }

  /** Draws the photo at `zoom` shifted by panX/panY px, darkened by `dim` 0..1; `t` animates a brand fill. */
  draw(zoom: number, panX = 0, panY = 0, dim = 0, t = 0): THREE.Texture {
    const c = this.layer.ctx;
    this.layer.clear();
    const img = this.img;
    if (!img) {
      const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
      g.addColorStop(0, '#4A2E1C'); g.addColorStop(1, '#0C0806');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    } else if (this.o.fit === 'height') {
      this.placed = this.place(zoom, panX, panY);
      const { x0, y0, w, h } = this.placed;
      if (this.o.fill === 'brand') brandBackground(c, t, 1);
      else if (this.soft) { c.drawImage(this.soft, 0, 0, W, H); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(0, 0, W, H); }
      if (this.o.blend === 'multiply') c.globalCompositeOperation = 'multiply';
      c.drawImage(this.feathered ?? img, x0, y0, w, h);
      c.globalCompositeOperation = 'source-over';
    } else if (this.soft) {
      c.save();
      c.translate(W / 2 + panX, H / 2 + panY);
      c.scale(zoom, zoom);
      c.drawImage(this.soft, -W / 2, -H / 2, W, H);
      c.restore();
    } else {
      this.placed = this.place(zoom, panX, panY);
      const { x0, y0, w, h } = this.placed;
      c.drawImage(img, x0, y0, w, h);
    }
    if (dim > 0) { c.fillStyle = `rgba(0,0,0,${dim})`; c.fillRect(0, 0, W, H); }
    if (!img && this.src) {
      const lab = labelFamily(), msg = `photo missing: app/public/${this.src}`;
      c.font = font(lab, 24);
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.fillText(msg, W - 60 - measure(msg, lab, 24), H - 50);
    }
    return this.layer.upload();
  }
}

// ------------------------------------------------------------------ an app screen inside a photographed phone

/**
 * The 3x3 perspective transform (a "homography") that maps the four `src` points onto the four
 * `dst` points: how a flat rectangle looks when seen at an angle. Solved as 8 linear equations.
 * Returned row by row, with the last entry fixed at 1.
 */
export function homography(src: [number, number][], dst: [number, number][]): number[] {
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i]!, [u, v] = dst[i]!;
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u, u]);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v, v]);
  }
  for (let col = 0; col < 8; col++) { // Gaussian elimination with partial pivoting
    let piv = col;
    for (let r = col + 1; r < 8; r++) if (Math.abs(A[r]![col]!) > Math.abs(A[piv]![col]!)) piv = r;
    [A[col], A[piv]] = [A[piv]!, A[col]!];
    for (let r = 0; r < 8; r++) {
      if (r === col) continue;
      const f = A[r]![col]! / A[col]![col]!;
      for (let k = col; k < 9; k++) A[r]![k]! -= f * A[col]![k]!;
    }
  }
  return [...A.map((row, i) => row[8]! / row[i]!), 1];
}

/**
 * Draws a screen texture into four corner points of the frame (px, from the top-left, in the order
 * top-left, top-right, bottom-right, bottom-left), in perspective, with rounded corners and a faint
 * glass sheen. The shader runs the homography for every pixel: frame px -> screen uv.
 */
export class PhotoScreen {
  pass: FSPass;
  constructor(tex: THREE.Texture) {
    this.pass = new FSPass(
      /* glsl */ `uniform sampler2D tex; uniform mat3 hm; uniform float radius, aspect, bright;
      void main() {
        vec3 q = hm * vec3(FRAG_PX.x, ${H.toFixed(1)} - FRAG_PX.y, 1.0);
        vec2 uv = q.xy / q.z;
        // rounded-rectangle mask (in units of the screen's height), with an antialiased edge
        vec2 d = abs(uv - 0.5) * vec2(aspect, 1.0);
        float dist = length(max(d - (vec2(0.5 * aspect, 0.5) - radius), 0.0)) - radius;
        float aa = fwidth(dist) + 1e-5;
        float m = 1.0 - smoothstep(-aa, aa, dist);
        if (m <= 0.0 || q.z <= 0.0) discard;
        vec3 col = texture(tex, vec2(uv.x, 1.0 - uv.y)).rgb * bright;
        col += vec3(0.035) * smoothstep(0.7, 0.0, uv.x + uv.y * 0.6); // light catching the glass
        fragColor = vec4(col, m);
      }`,
      { tex: { value: tex }, hm: { value: new THREE.Matrix3() }, radius: { value: 0.045 }, aspect: { value: 0.46 }, bright: { value: 1 } },
      { blending: THREE.NormalBlending, transparent: true },
    );
  }

  /** `corners` in frame px; `grow` scales them about their centre (1.02 = 2% larger) to cover the photo's own screen edge. */
  render(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, corners: [number, number][], grow = 1.015, radius = 0.045) {
    const cx = corners.reduce((a, p) => a + p[0], 0) / 4, cy = corners.reduce((a, p) => a + p[1], 0) / 4;
    const pts = corners.map(([x, y]) => [cx + (x - cx) * grow, cy + (y - cy) * grow] as [number, number]);
    const h = homography(pts, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    (this.pass.u.hm!.value as THREE.Matrix3).set(h[0]!, h[1]!, h[2]!, h[3]!, h[4]!, h[5]!, h[6]!, h[7]!, h[8]!);
    const len = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    this.pass.u.aspect!.value = (len(pts[0]!, pts[1]!) + len(pts[3]!, pts[2]!)) / (len(pts[0]!, pts[3]!) + len(pts[1]!, pts[2]!));
    this.pass.u.radius!.value = radius;
    this.pass.render(renderer, out);
  }
}

// ------------------------------------------------------------------ headline text over photos

/** The words of a photo shot, with an optional size cap. */
export type PhotoCopy = Copy & {
  size?: number;
  accentStyle?: 'photo' | 'gold';
  /** Seconds between one line's entrance and the next (default 0.2), and between words (default 0.07). */
  lineGap?: number;
  stagger?: number;
};

/**
 * Kicker, headline and sub line in a text column at x (left / centre / right aligned), sized so the
 * longest line fits `maxW`, placed at the top, middle or bottom of the frame. Over photos, so each
 * letter gets a soft shadow.
 */
export function photoCopy(c: CanvasRenderingContext2D, copy: PhotoCopy, x: number, align: Align, maxW: number, valign: unknown, t: number, t0 = 0.3) {
  const lines = copy.lines ?? [];
  if (!lines.length) return;
  const size = Math.min(copy.size ?? 110, ...lines.map((l) => fitSize(l, displayFamily(), maxW)));
  const subSize = clamp(size * 0.34, 28, 38);
  const blockH = (lines.length - 1) * size * 1.05 + (copy.sub ? subSize * 2.6 : 0);
  const y1 = valign === 'top' ? 190 + size * 0.75 : valign === 'bottom' ? H - 140 - blockH : H / 2 - blockH / 2 + size * 0.35;
  const colors = accentColors(copy.accentStyle);
  if (copy.kicker) kicker(c, copy.kicker, x, y1 - size - 18, t, t0 - 0.2, align, colors[1]);
  const gap = copy.lineGap ?? 0.2;
  const yLast = kineticBlock(c, lines, x, y1, size, t, t0, { align, accent: copy.accent, shadow: true, gap, stagger: copy.stagger, accentColors: colors });
  if (copy.sub) bodyText(c, copy.sub, x, yLast + subSize * 2.1, subSize, maxW, t, t0 + 0.25 + (lines.length - 1) * gap + 0.2, align, 'bone');
}

/** Darkens the side (or top) of the frame where text sits, so white text reads on any photo. */
export function shadeForText(c: CanvasRenderingContext2D, align: Align, valign: unknown, amount = 0.6) {
  const g = align === 'center'
    ? (valign === 'bottom' ? c.createLinearGradient(0, H, 0, H * 0.45) : c.createLinearGradient(0, 0, 0, H * 0.55))
    : align === 'left' ? c.createLinearGradient(0, 0, W * 0.62, 0) : c.createLinearGradient(W, 0, W * 0.38, 0);
  g.addColorStop(0, `rgba(0,0,0,${amount})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

/** Zoom and pan of a photo for a camera move at progress p (0..1): "push", "pull", "track" or "still". */
export function photoMove(move: unknown, p: number, side = 1): { zoom: number; panX: number } {
  const e = ease.inOutCubic(clamp(p)) * 0.3 + clamp(p) * 0.7; // nearly linear: a steady, gliding move
  switch (move) {
    case 'pull': return { zoom: 1.16 - 0.1 * e, panX: 0 };
    case 'track': return { zoom: 1.12, panX: side * lerp(60, -60, e) };
    case 'still': return { zoom: 1.03, panX: 0 };
    default: return { zoom: 1.04 + 0.12 * e, panX: 0 }; // push
  }
}

/**
 * A copy of an image with its pale, low-colour background made transparent (whites, greys and
 * beiges fade out; strongly coloured parts stay), so artwork on a pale background can sit on any colour.
 */
export function keyOutLight(img: HTMLImageElement): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const c = cv.getContext('2d')!;
  c.drawImage(img, 0, 0);
  const d = c.getImageData(0, 0, cv.width, cv.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i]!, g = p[i + 1]!, b = p[i + 2]!;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max ? (max - min) / max : 0; // 0 = grey
    const keep = clamp((sat - 0.2) / 0.2); // greys and beiges (low colour) -> transparent; the coloured art stays
    p[i + 3] = Math.round(p[i + 3]! * clamp(keep));
  }
  c.putImageData(d, 0, 0);
  return cv;
}
