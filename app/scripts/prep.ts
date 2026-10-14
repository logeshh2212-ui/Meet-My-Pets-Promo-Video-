#!/usr/bin/env bun
// Run after every storyboard change:  bun scripts/prep.ts
// The engine was built for a song: it reads data/audio.json (length, beats) and data/lyrics.json
// (words), and the preview plays audio/track.mp3 as its clock. This writes all three, sized to the
// storyboard: the beat grid from music.bpm, and the soundtrack cut from music.file (or silence).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import storyboard from '../src/storyboard.json';
import { beatLength, shotTimes, type Storyboard } from '../src/shots';

const ROOT = path.resolve(import.meta.dir, '../..');
const sb = storyboard as Storyboard;
const times = shotTimes(sb);
const duration = Math.round(times.at(-1)!.end * 1000) / 1000;
const bpm = sb.music?.bpm ?? 120;

// a steady beat grid from the tempo (bar = 4 beats), so scenes can move on the beat (f.beat, f.beatPhase)
const beat = beatLength(sb);
const beats: number[] = [];
for (let t = 0; t <= duration + 1e-6; t += beat) beats.push(Math.round(t * 1000) / 1000);
const downbeats = beats.filter((_, i) => i % 4 === 0);

mkdirSync(path.join(ROOT, 'data'), { recursive: true });
writeFileSync(path.join(ROOT, 'data/audio.json'), JSON.stringify({
  duration, bpm, fps: 100, beats, downbeats, sections: [], onsets: {},
}));
writeFileSync(path.join(ROOT, 'data/lyrics.json'), JSON.stringify({ lines: [] }));

// the soundtrack: the music cut to the film's length with a fade-out, or silence when there is none
mkdirSync(path.join(ROOT, 'audio'), { recursive: true });
const out = path.join(ROOT, 'audio/track.mp3');
const music = sb.music?.file ? path.join(ROOT, sb.music.file) : null;
const hasMusic = !!music && existsSync(music);
const fade = Math.min(sb.music?.fadeOut ?? 1.5, duration);
const args = hasMusic
  ? ['-ss', String(sb.music?.start ?? 0), '-t', String(duration), '-i', music!,
     '-af', `afade=t=in:d=0.05,afade=t=out:st=${(duration - fade).toFixed(3)}:d=${fade}`, '-c:a', 'libmp3lame', '-b:a', '192k']
  : ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', String(duration), '-c:a', 'libmp3lame', '-b:a', '64k'];
const ff = Bun.spawnSync(['ffmpeg', '-y', '-loglevel', 'error', ...args, out]);
if (ff.exitCode !== 0) throw new Error(`ffmpeg failed: ${ff.stderr.toString()}`);

console.log(`film length ${duration.toFixed(2)} s, ${sb.shots.length} shots, ${bpm} bpm`);
console.log(hasMusic ? `soundtrack: ${sb.music!.file} from ${sb.music?.start ?? 0} s` : `soundtrack: silence${sb.music?.file ? ` (${sb.music.file} not found)` : ''}`);
times.forEach((t, i) => {
  const s = sb.shots[i]!;
  console.log(`  ${String(i + 1).padStart(2, '0')} ${s.template.padEnd(9)} ${t.start.toFixed(2)} -> ${t.end.toFixed(2)} s  ${s.transitionType ?? 'fade'}`);
});
