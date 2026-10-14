// Shared base for the shots of the 30 s launch film. A shot draws, every frame:
//   1. its background (warm studio, dark ember or coral) from `bg`
//   2. a 3D stage (phone and/or free-floating widgets) lit like a product shot
//   3. a 2D layer on top (`fg`): headline, paw taps, flashes
// Subclasses implement frame() (camera, widget poses, widget repaints) and overlay() (2D on top).
// Helpers: camera keyframes with snappy easing, tag-type headlines, image loading.
import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT, makeRT } from '../engine/gl';
import { F, font, measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { loadImageQuiet, makeStage, renderStage } from './_cine';
import type { LaunchShot } from '../timeline';
import { World, paintBackdrop, PALETTE, type Act } from './_world';

/** One beat of the music (measured), and one bar. */
export const BEAT = 0.82775, BAR = 4 * BEAT;
export const C = { red: '#FF1744', orange: '#FF7A00', amber: '#FFC107', ink: '#212738', grey: '#667086', paper: '#FFFAFA' };
export type Look = 'studio' | 'dark' | 'coral';

/** A camera keyframe: at time t (s), the camera at `pos` looking at `at`; `e` = easing into it. */
export type CamKey = { t: number; pos: [number, number, number]; at: [number, number, number]; e?: (x: number) => number };

export abstract class Shot extends Scene {
  bg = new Layer2D();
  fg = new Layer2D();
  stage!: ReturnType<typeof makeStage>;
  shot!: LaunchShot;
  look: Look = 'studio';
  /** The act's world (colour, floating decor, floor, key light), if the shot made one with makeWorld(). */
  world: World | null = null;
  act: Act | null = null;
  /** One multisampled stage target shared by every shot (they never render at the same time): GPU memory. */
  private static stageRT: THREE.WebGLRenderTarget | null = null;
  /** How hard the frame punches in on every beat (0 = off). */
  punch = 0.022;
  private imgs = new Map<string, HTMLImageElement | null>();

  /** Loads what the shot needs (images, widgets) and builds its stage. */
  abstract setup(): Promise<void>;
  /** Per frame, before the stage renders: camera, widget poses and repaints. `lt` = seconds into the shot. */
  abstract frame(lt: number, f: Frame): void;
  /** Per frame, 2D on top of the stage. */
  abstract overlay(c: CanvasRenderingContext2D, lt: number, f: Frame): void;

  override async init() {
    this.shot = this.ctx.params as LaunchShot;
    this.stage = makeStage(this.ctx.renderer);
    await this.setup();
    this.paintBackground();
  }

  async img(src: string): Promise<HTMLImageElement | null> {
    if (!this.imgs.has(src)) this.imgs.set(src, await loadImageQuiet(src));
    return this.imgs.get(src)!;
  }

  /** Builds the act's world: its backdrop colours, decor in depth, an optional shadow floor. */
  makeWorld(act: Act, o: { count?: number; center?: [number, number, number]; floorY?: number | null; seed?: number } = {}) {
    this.act = act;
    this.look = PALETTE[act].dark ? 'dark' : act === 'montage' ? 'coral' : 'studio';
    this.world = new World(this.ctx.renderer, this.stage.scene, act, o);
    return this.world;
  }

  /** The backdrop (drawn once): the act's gradient, or a soft pool of light on warm paper, dark ember, coral. */
  paintBackground() {
    const c = this.bg.ctx;
    this.bg.clear();
    if (this.act) { paintBackdrop(c, this.act); this.bg.upload(); return; }
    if (this.look === 'dark') {
      c.fillStyle = '#120A0A'; c.fillRect(0, 0, W, H);
      glow(c, W * 0.55, H * 0.5, 1000, 'rgba(255,90,40,0.30)');
    } else if (this.look === 'coral') {
      const g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#FF2E63'); g.addColorStop(1, '#FF8A3D');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      glow(c, W / 2, H * 0.45, 900, 'rgba(255,255,255,0.18)');
    } else {
      c.fillStyle = '#FFE3D6'; c.fillRect(0, 0, W, H);
      glow(c, W * 0.55, H * 0.45, 1300, 'rgba(255,250,250,1)');
    }
    this.bg.upload();
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    comp.draw(renderer, this.bg.texture, out);
    this.frame(f.lt, f);
    this.world?.update(f.lt, this.stage.cam);
    // the 3D stage renders into its own 4x multisampled target (smooth edges: the engine's canvas has no
    // antialiasing), cleared transparent, then goes over the backdrop (its colours come out premultiplied)
    const rt = (Shot.stageRT ??= makeRT(W, H, { samples: 4 }));
    clearRT(renderer, rt, [0, 0, 0], 0);
    renderer.setRenderTarget(rt);
    renderer.render(this.stage.scene, this.stage.cam);
    comp.draw(renderer, rt.texture, out, { premult: false });
    this.fg.clear();
    this.overlay(this.fg.ctx, f.lt, f);
    comp.draw(renderer, this.fg.upload(), out);
    const light = this.look === 'studio';
    // a quick punch-in on every beat (decays within ~0.15 s), like a camera operator hitting the music
    const zoom = 1 + this.punch * Math.exp(-f.beatPhase * 9);
    return { hud: 0, zoom, bloom: light ? 0.05 : 0.3, bloomThreshold: light ? 2.5 : 0.9, vignette: light ? 0.12 : 0.35, ca: light ? 0.05 : 0.15, grain: 0.02 };
  }

  /** Camera along keyframes (each key eases in with its own curve, default a snappy outExpo). */
  camera(lt: number, keys: CamKey[]) {
    const cam = this.stage.cam;
    let i = 0;
    while (i < keys.length - 1 && lt >= keys[i + 1]!.t) i++;
    const a = keys[i]!, b = keys[Math.min(i + 1, keys.length - 1)]!;
    const span = b.t - a.t;
    const k = span > 0 ? (b.e ?? ease.outExpo)(clamp((lt - a.t) / span)) : 1;
    const v = (p: [number, number, number], q: [number, number, number]) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(p[2], q[2], k)] as const;
    const pos = lt >= b.t ? b.pos : v(a.pos, b.pos), at = lt >= b.t ? b.at : v(a.at, b.at);
    cam.position.set(pos[0], pos[1], pos[2]);
    cam.lookAt(at[0], at[1], at[2]);
    cam.updateMatrixWorld(true);
  }

  /** The shot's headline in tag type (kicker above, words spring in, the accent words hang in a collar-tag pill). */
  headline(c: CanvasRenderingContext2D, lt: number, o: { x: number; y: number; size?: number; at?: number; align?: 'left' | 'center'; ink?: string; until?: number; title?: string }) {
    const s = this.shot;
    tagType(c, lt, { kicker: s.kicker, accent: s.accent, ...o, title: o.title ?? s.title });
  }
}

/** A soft radial glow. */
export function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

const norm = (w: string) => w.replace(/[.,!?…]+$/u, '');

/**
 * Tag type: a short headline whose words spring in a 1/16 note apart (from `at`); the accent words are
 * one phrase in a gradient pill hanging from a small ring (a collar tag) that swings and settles.
 * Lines are split on '\n'. Gone by `until` (seconds into the shot).
 */
export function tagType(c: CanvasRenderingContext2D, lt: number, o: {
  kicker?: string; title: string; accent?: string; x: number; y: number; size?: number; at?: number;
  align?: 'left' | 'center'; ink?: string; until?: number;
}) {
  const size = o.size ?? 92, lead = size * 1.12, at = o.at ?? 0.1, align = o.align ?? 'left';
  const out = o.until != null ? 1 - prog(lt, o.until - 0.25, o.until, ease.inCubic) : 1;
  if (out <= 0) return;
  const fam = F.brandDisplay(700), step = BEAT / 4;
  const accentWords = new Set((o.accent || '').split(' ').map(norm).filter(Boolean));
  c.save();
  c.globalAlpha = out;
  if (o.kicker) {
    const kk = prog(lt, at, at + 0.3, ease.outCubic);
    c.globalAlpha = out * kk;
    c.font = font(F.brandDisplay(600), Math.round(size * 0.32));
    c.fillStyle = C.red; c.textAlign = align;
    c.fillText(o.kicker.toUpperCase().split('').join(' '), o.x, o.y - size * 0.98);
    c.globalAlpha = out;
  }
  let y = o.y, wi = 0;
  for (const line of o.title.split('\n')) {
    const runs: { text: string; accent: boolean }[] = [];
    for (const w of line.split(' ')) {
      const a = accentWords.has(norm(w)), last = runs.at(-1);
      if (a && last?.accent) last.text += ' ' + w; else runs.push({ text: w, accent: a });
    }
    const space = measure(' ', fam, size);
    const widths = runs.map((r) => measure(r.text, fam, size) + (r.accent ? size * 0.44 : 0));
    const lineW = widths.reduce((p, q) => p + q, 0) + space * (runs.length - 1);
    let x = align === 'center' ? o.x - lineW / 2 : o.x;
    runs.forEach((r, i) => {
      const t0 = at + wi * step, k = prog(lt, t0, t0 + 0.35, ease.outBack);
      if (k > 0) drawWord(c, r.text, x + (r.accent ? size * 0.22 : 0), y, size, fam, k, lt - t0, r.accent, o.ink ?? C.ink);
      x += widths[i]! + space;
      wi += r.text.split(' ').length;
    });
    y += lead;
  }
  c.restore();
}

function drawWord(c: CanvasRenderingContext2D, w: string, x: number, y: number, size: number, fam: string, k: number, age: number, accent: boolean, ink: string) {
  c.save();
  c.font = font(fam, size);
  c.textAlign = 'left';
  const ww = measure(w, fam, size);
  if (accent) {
    const swing = 0.22 * Math.exp(-age * 5) * Math.cos(age * 16);
    const px = x - size * 0.22, pw = ww + size * 0.44, ph = size * 1.12, py = y - size * 0.88;
    c.translate(px + pw / 2, py - size * 0.18); c.rotate(swing); c.scale(k, k); c.translate(-(px + pw / 2), -(py - size * 0.18));
    const g = c.createLinearGradient(px, py, px + pw, py + ph);
    g.addColorStop(0, C.red); g.addColorStop(1, C.orange);
    c.fillStyle = g;
    c.beginPath(); c.roundRect(px, py, pw, ph, ph / 2); c.fill();
    c.strokeStyle = C.amber; c.lineWidth = size * 0.05;
    c.beginPath(); c.arc(px + pw / 2, py - size * 0.08, size * 0.1, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#FFFFFF';
    c.fillText(w, x, y);
  } else {
    c.globalAlpha *= clamp(k);
    c.fillStyle = ink;
    c.fillText(w, x, y + (1 - Math.min(1, k)) * size * 0.3);
  }
  c.restore();
}

/** 0 → 1 → 0 over `dur` seconds from t0 (a press, a bump). */
export const bump = (lt: number, t0: number, dur = 0.25) => {
  const a = lt - t0;
  return a >= 0 && a < dur ? Math.sin((a / dur) * Math.PI) : 0;
};

/** A word-flash: big centred text that slams in on a beat and is gone before the next (the montage). */
export function slam(c: CanvasRenderingContext2D, text: string, lt: number, t0: number, dur: number, size = 150, color = C.ink) {
  const a = lt - t0;
  if (a < 0 || a > dur) return;
  const k = ease.outBack(clamp(a / 0.18)), out = 1 - prog(a, dur - 0.12, dur);
  c.save();
  c.globalAlpha = out;
  c.font = font(F.brandDisplay(700), size); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.translate(W / 2, H / 2); c.scale(lerp(1.25, 1, k), lerp(1.25, 1, k));
  c.fillStyle = color;
  c.fillText(text, 0, 0);
  c.restore();
}

export { THREE };
