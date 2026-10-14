// Shared look for the launch-film templates (type, phone, features, endcard): keynote-style text
// reveals, a soft spotlight background, the paw icon, image loading and fades at the film's ends.
// Colours come from src/theme.json through palette.ts; fonts and easing through the functions below.
import theme from '../theme.json';
import { FSPass, W, H } from '../engine/gl';
import { F, font, measure } from '../engine/type';
import { rgba } from '../engine/palette';
import { ease, prog } from '../engine/util';
import type { Frame, SceneCtx } from '../engine/scene';

export const T = theme;

/** The easing curve named in theme.motion.ease (outQuart, inOutCubic, outBack, ...). */
export const easeFn: (x: number) => number = (ease as Record<string, (x: number) => number>)[theme.motion.ease] ?? ease.outQuart;

/** Font family names (for font() and measure()) chosen by theme.type. */
export function displayFamily(): string {
  const { display, displayWidth, displayWeight } = theme.type;
  if (display === 'serif') return F.serif(displayWeight);
  if (display === 'mono') return F.mono(displayWeight);
  return F.archivo(displayWidth, displayWeight);
}
export function labelFamily(): string {
  const { label, labelWeight } = theme.type;
  if (label === 'serif') return F.serif(labelWeight);
  if (label === 'mono') return F.mono(labelWeight);
  return F.archivo(100, labelWeight);
}

/** 0..1 progress of an entrance that starts at t0 and lasts dur seconds (eased by the theme). */
export const reveal = (t: number, t0: number, dur = 0.9) => prog(t, t0, t0 + dur, easeFn);

/**
 * Keynote-style text entrance: at k = 0 the text is invisible, blurred and slightly low; at k = 1 it
 * is sharp and in place. `align` is relative to x. Returns the text's width.
 */
export function drawReveal(
  c: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, family: string,
  k: number, color = 'bone', align: 'left' | 'center' | 'right' = 'left',
): number {
  const w = measure(text, family, size);
  if (k <= 0) return w;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  c.save();
  c.font = font(family, size);
  c.globalAlpha = Math.min(1, k * 1.2);
  if (k < 1) c.filter = `blur(${((1 - k) * size * 0.12).toFixed(2)}px)`;
  c.fillStyle = rgba(color);
  c.fillText(text, x0, y + (1 - k) * size * 0.18);
  c.restore();
  return w;
}

/** A paw print centred at (x, y), `s` = overall size in px. */
export function drawPaw(c: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  c.save();
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y + s * 0.18, s * 0.3, s * 0.25, 0, 0, Math.PI * 2); // pad
  for (const [dx, dy, r] of [[-0.34, -0.12, 0.12], [-0.12, -0.33, 0.13], [0.12, -0.33, 0.13], [0.34, -0.12, 0.12]] as const) {
    c.moveTo(x + dx * s + r * s, y + dy * s);
    c.ellipse(x + dx * s, y + dy * s, r * s, r * s * 1.2, 0, 0, Math.PI * 2); // toes
  }
  c.fill();
  c.restore();
}

/** Loads an image from app/public (e.g. 'assets/home.png'); resolves null if it is missing. */
export async function loadImage(src: string | undefined): Promise<HTMLImageElement | null> {
  if (!src) return null;
  const img = new Image();
  img.src = src;
  try { await img.decode(); return img; } catch { return null; }
}

/** Draws `img` to fill the box (cropping the overflow), like CSS object-fit: cover. */
export function drawCover(c: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
  c.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

/**
 * Background: the theme's background colour with a soft pool of light (a "spotlight") at (cx, cy)
 * in px. Set u.k (0..1 strength) each frame; u.center / u.radius to move it.
 */
export function makeSpotlight(cx = W / 2, cy = H / 2, radius = 700): FSPass {
  return new FSPass(
    /* glsl */ `uniform float k; uniform vec2 center; uniform float radius;
    void main() {
      vec2 p = (FRAG_PX - center) / radius;
      float g = exp(-dot(p, p) * 1.6);
      vec3 c = C_INK + (C_INK2 * 0.9 + C_SIGNAL * 0.05) * g * k;
      fragColor = vec4(c, 1.0);
    }`,
    { k: { value: 1 }, center: { value: [cx, cy] }, radius: { value: radius } },
  );
}

/** Fade from black at the very start of the film and to black at its very end (post 'fade'). */
export function filmEdgeFade(f: Frame, ctx: SceneCtx): number {
  const fin = ctx.start <= 0.001 ? 1 - prog(f.t, 0, 0.6) : 0;
  const fout = ctx.end >= ctx.audio.duration - 0.001 ? prog(f.t, ctx.end - 0.8, ctx.end) : 0;
  return Math.max(fin, fout);
}

/** Slow "camera push-in" for a whole Canvas2D layer: scales about the frame centre. */
export function pushIn(c: CanvasRenderingContext2D, k: number, amount = 0.04) {
  const s = 1 + amount * k;
  c.translate(W / 2, H / 2);
  c.scale(s, s);
  c.translate(-W / 2, -H / 2);
}