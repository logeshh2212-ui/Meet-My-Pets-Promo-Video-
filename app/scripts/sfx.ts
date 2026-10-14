#!/usr/bin/env bun
// Sound effects for the 30 s film, synthesised in code (no sound files needed) and mixed under the music.
//   bun scripts/sfx.ts                       → writes ../out/sfx.wav (the effects alone, 48 kHz)
//   bun scripts/sfx.ts --mux in.mp4 out.mp4  → also mixes music + effects into the video's sound
// Every cue is at the film time of the action it belongs to (shot start + the time inside the shot,
// the same numbers the scenes use), so taps, typing, pops and whooshes land exactly on the picture.
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const SR = 48000, DUR = 30.585;
const out = new Float32Array(Math.ceil(SR * DUR));
const ROOT = path.resolve(import.meta.dir, '../..');

// ---------------------------------------------------------------- tiny synth
let seed = 12345;
const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
/** Adds a sound at time t (s) with gain g; `fn(i, x)` gives sample i (x = seconds into the sound). */
function add(t: number, len: number, g: number, fn: (x: number) => number) {
  const i0 = Math.round(t * SR), n = Math.round(len * SR);
  for (let i = 0; i < n && i0 + i < out.length; i++) if (i0 + i >= 0) out[i0 + i]! += g * fn(i / SR);
}
const sin = (f: number, x: number) => Math.sin(2 * Math.PI * f * x);
const SOUNDS = {
  /** a soft key tick */
  key: (t: number, g = 0.22) => add(t, 0.03, g, (x) => (sin(3200, x) * 0.6 + noise() * 0.4) * Math.exp(-x * 260)),
  /** a paw tap: a soft click with a little body */
  tap: (t: number, g = 0.4) => add(t, 0.09, g, (x) => (sin(1500, x) * Math.exp(-x * 120) * 0.5 + sin(190, x) * Math.exp(-x * 45) * 0.7 + noise() * Math.exp(-x * 400) * 0.3)),
  /** a bubbly pop (likes, things landing) */
  pop: (t: number, g = 0.35) => add(t, 0.14, g, (x) => sin(480 + 900 * Math.min(1, x / 0.05), x) * Math.exp(-x * 30)),
  /** a soft thud (things dropping onto the desk, a stamp) */
  thud: (t: number, g = 0.5) => add(t, 0.25, g, (x) => (sin(105, x) * 0.8 + noise() * 0.2 * Math.exp(-x * 60)) * Math.exp(-x * 18)),
  /** a whoosh of length d (camera whips, things flying): filtered noise swelling and fading */
  whoosh: (t: number, d = 0.4, g = 0.3) => {
    let y = 0;
    add(t, d, g, (x) => { const k = x / d, a = 0.04 + 0.25 * k; y += a * (noise() - y); return y * Math.pow(Math.sin(Math.PI * k), 2) * 2.2; });
  },
  /** a two-note notification ding */
  ding: (t: number, g = 0.28) => { add(t, 0.5, g, (x) => sin(1318.5, x) * Math.exp(-x * 9)); add(t + 0.09, 0.6, g, (x) => sin(1760, x) * Math.exp(-x * 7)); },
  /** the match chime: a bright major chord that rings out */
  chime: (t: number, g = 0.3) => { for (const [f, d] of [[1046.5, 0], [1318.5, 0.03], [1568, 0.06], [2093, 0.09]] as const) add(t + d, 1.6, g * 0.6, (x) => (sin(f, x) + 0.3 * sin(f * 2.01, x)) * Math.exp(-x * 2.6)); },
};
const { key, tap, pop, thud, whoosh, ding, chime } = SOUNDS;

// ---------------------------------------------------------------- the cues (film time = shot start + local time)
const BAR = 3.311;
const S = (n: number) => (n - 1) * BAR; // shot n starts at bar n - 1 (S09 at the final hit)
const typing = (t0: number, n: number, per: number, g = 0.2) => { for (let i = 0; i < n; i++) key(t0 + i * per, g * (0.8 + 0.4 * ((i * 7) % 5) / 5)); };

// S01 text → logo: the words pop, the loops fly in and lock on the drop, the wordmark writes, the zoom through
for (let i = 0; i < 5; i++) key(0.05 + i * 0.2587, 0.25);
whoosh(1.3, 0.38, 0.35); pop(1.656, 0.4);
typing(1.856, 11, 0.05, 0.14);
whoosh(2.56, 0.7, 0.32);
// S02 sign in: email + password typing on the giant keyboard, the whip, the Login press, the burst
typing(S(2) + 0.25, 19, 0.045); whoosh(S(2) + 1.3, 0.3, 0.25); typing(S(2) + 1.36, 8, 0.055);
whoosh(S(2) + 2.35, 0.3, 0.22); tap(S(2) + 2.5, 0.5); thud(S(2) + 2.52, 0.35); whoosh(S(2) + 2.85, 0.4, 0.35);
// S03 pet profile: location tap + pin, polaroid drop, the tag stamped, Female, trait blocks, the medal, Create
tap(S(3) + 0.4); pop(S(3) + 0.62, 0.3); thud(S(3) + 0.83 + 0.12, 0.45);
for (let i = 0; i < 6; i++) thud(S(3) + 1.2 + i * 0.07, 0.16);
tap(S(3) + 1.66); for (let i = 0; i < 5; i++) thud(S(3) + 1.86 + i * 0.05 + 0.12, 0.18);
tap(S(3) + 2.05, 0.3); tap(S(3) + 2.24, 0.3); tap(S(3) + 2.55, 0.45); ding(S(3) + 2.7, 0.18); whoosh(S(3) + 2.78, 0.5, 0.28);
// S04 feed: the wall rushing, the post popping out, the double-tap like, Follow, the flick
whoosh(S(4), 0.8, 0.3); pop(S(4) + 0.82, 0.3); tap(S(4) + 0.95, 0.35); tap(S(4) + 1.08, 0.35); pop(S(4) + 1.1, 0.45);
tap(S(4) + 1.72, 0.4); whoosh(S(4) + 2.6, 0.65, 0.35);
// S05 discover: the carousel spins in, ✕ and the card flicked away, the turn to Lily, ♥ stamp, the rush
whoosh(S(5), 0.75, 0.3); tap(S(5) + 0.86, 0.4); whoosh(S(5) + 0.9, 0.4, 0.3); whoosh(S(5) + 1.45, 0.5, 0.22);
tap(S(5) + 2.52, 0.4); thud(S(5) + 2.56, 0.4); whoosh(S(5) + 2.85, 0.45, 0.32);
// S06 match: the loops fly and lock (the chime), the notification, Chat Now, the swell
whoosh(S(6) + 0.08, 0.36, 0.3); chime(S(6) + 0.42, 0.34); ding(S(6) + 0.65, 0.22);
for (let i = 0; i < 4; i++) pop(S(6) + 0.5 + i * 0.18, 0.12);
tap(S(6) + 2.52, 0.45); whoosh(S(6) + 2.78, 0.5, 0.3);
// S07 chat: typing, send, the bubble lands at Lily's, her reply lands at Bubbly's
typing(S(7) + 0.4, 21, 0.05, 0.18); tap(S(7) + 1.68, 0.4); whoosh(S(7) + 1.72, 0.34, 0.25); pop(S(7) + 2.05, 0.4);
pop(S(7) + 2.1, 0.12); whoosh(S(7) + 2.5, 0.32, 0.22); pop(S(7) + 2.82, 0.4);
// S08 montage: a whoosh on each word, the swirl into the point
for (let i = 0; i < 3; i++) whoosh(S(8) + i * 0.8277 - 0.05, 0.3, 0.32);
whoosh(S(8) + 2.48, 0.8, 0.36);
// S09 end: a soft sparkle as the logo locks (the music's own final hit carries it)
ding(26.488 + 0.15, 0.12);

// ---------------------------------------------------------------- write the WAV (16-bit, stereo, 48 kHz)
let peak = 0; for (const v of out) peak = Math.max(peak, Math.abs(v));
const norm = peak > 0.95 ? 0.95 / peak : 1;
const buf = Buffer.alloc(44 + out.length * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + out.length * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(out.length * 4, 40);
for (let i = 0; i < out.length; i++) { const v = Math.round(Math.max(-1, Math.min(1, out[i]! * norm)) * 32767); buf.writeInt16LE(v, 44 + i * 4); buf.writeInt16LE(v, 46 + i * 4); }
const wav = path.join(ROOT, 'out', 'sfx.wav');
writeFileSync(wav, buf);
console.log(`wrote ${wav} (peak ${peak.toFixed(2)})`);

// ---------------------------------------------------------------- optional: mix music + effects into a video
const mi = process.argv.indexOf('--mux');
if (mi >= 0) {
  const [vin, vout] = [process.argv[mi + 1]!, process.argv[mi + 2]!];
  const music = path.join(ROOT, 'audio', 'track.mp3');
  // the effects sit about 9 dB under the music; a light limiter keeps the sum from clipping
  const ff = Bun.spawnSync(['ffmpeg', '-v', 'error', '-y', '-i', vin, '-i', music, '-i', wav,
    '-filter_complex', '[2:a]volume=0.36[s];[1:a][s]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.89:level=0[a]',
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', vout]);
  if (ff.exitCode !== 0) throw new Error(ff.stderr.toString());
  console.log(`wrote ${vout}`);
}
