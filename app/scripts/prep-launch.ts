#!/usr/bin/env bun
// Prepares the data the engine reads, for the MeetMyPets launch film:
//   bun scripts/prep-launch.ts
// The film is driven by docs/launch-film/storyboard.launch.json (shot times measured from the music).
// The engine was built for a song: it needs data/audio.json (length + beat grid), data/lyrics.json
// (words; empty here) and audio/track.mp3 (the soundtrack the preview and the export play).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sb from '../../docs/launch-film/storyboard.launch.json';

const ROOT = path.resolve(import.meta.dir, '../..');
const tb = sb.timing_basis;
const duration = sb.duration;
const start = (sb as { audio_start?: number }).audio_start ?? 0; // where in testing.mp3 the film's t = 0 is
const r3 = (x: number) => Math.round(x * 1000) / 1000;

// The beat grid measured from audio/testing.mp3, in film time: a beat every tb.beat_seconds with a
// downbeat on tb.first_downbeat, extended backwards to 0.
const beat = tb.beat_seconds;
const k0 = Math.ceil(-tb.first_downbeat / beat);
const beats: number[] = [], downbeats: number[] = [];
for (let k = k0; tb.first_downbeat + k * beat <= duration + 1e-6; k++) {
  const t = r3(tb.first_downbeat + k * beat);
  beats.push(t);
  if (((k % 4) + 4) % 4 === 0) downbeats.push(t);
}

mkdirSync(path.join(ROOT, 'data'), { recursive: true });
// delete first: on Windows, Bun's writeFileSync can leave the tail of a longer old file behind
for (const f of ['data/audio.json', 'data/lyrics.json']) rmSync(path.join(ROOT, f), { force: true });
writeFileSync(path.join(ROOT, 'data/audio.json'), JSON.stringify({
  duration, bpm: r3(60 / beat), fps: 100, beats, downbeats,
  sections: [], onsets: {},
}));
writeFileSync(path.join(ROOT, 'data/lyrics.json'), JSON.stringify({ lines: [] }));

// The soundtrack: testing.mp3 from `start` for the film's length, with a 30 ms fade-in so the cut
// into the middle of the track doesn't click. (It already ends in silence.)
mkdirSync(path.join(ROOT, 'audio'), { recursive: true });
const src = path.join(ROOT, sb.audio);
const out = path.join(ROOT, 'audio/track.mp3');
rmSync(out, { force: true });
const ff = Bun.spawnSync(['ffmpeg', '-y', '-loglevel', 'error', '-ss', String(start), '-t', String(duration), '-i', src,
  '-af', 'afade=t=in:d=0.03', '-c:a', 'libmp3lame', '-b:a', '320k', out]);
if (ff.exitCode !== 0) throw new Error(`ffmpeg failed: ${ff.stderr.toString()}`);

console.log(`film ${duration} s (${sb.duration_frames} frames at ${sb.fps} fps), ${sb.shots.length} shots`);
console.log(`beats: ${beats.length} (${r3(60 / beat)} bpm), downbeats: ${downbeats.length}`);
console.log(`soundtrack: ${sb.audio} from ${start} s -> audio/track.mp3`);
