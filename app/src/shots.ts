// Shot timing from the storyboard, shared by the timeline (in the browser) and scripts/prep.ts (in bun).
import type { TransitionType } from './engine/engine';

export type Shot = {
  template: string;
  /** Length in seconds, or in beats of the music (beats win when both are given). */
  duration?: number;
  beats?: number;
  /** Overlap with the previous shot, in seconds or in beats. */
  transition?: number;
  transitionBeats?: number;
  /** How the overlap looks: 'fade' (default), 'zoom', 'whip', 'dip' or 'flash'. */
  transitionType?: TransitionType;
  [key: string]: unknown;
};

export type Music = {
  /** Path from the repo root, e.g. "audio/music.mp3". Missing file: the film is silent. */
  file?: string;
  /** Tempo of the track. Shots measured in beats follow it. */
  bpm?: number;
  /** Seconds into the track where the film starts (pick a downbeat). */
  start?: number;
  /** Seconds of fade-out at the end of the film. */
  fadeOut?: number;
};

export type Storyboard = { title?: string; music?: Music; shots: Shot[] };

/** Length of one beat in seconds (120 bpm when the storyboard gives no tempo). */
export const beatLength = (sb: Storyboard) => 60 / (sb.music?.bpm ?? 120);

/**
 * Start and end of every shot. The cuts fall back to back (shot lengths add up, so cuts measured in
 * beats stay on the beat); a transition is centred on its cut: the incoming shot starts half of it
 * before the cut and the outgoing one ends half of it after.
 */
export function shotTimes(sb: Storyboard): { start: number; end: number }[] {
  const beat = beatLength(sb);
  const lens = sb.shots.map((s) => (s.beats != null ? s.beats * beat : s.duration ?? 4));
  const overlaps = sb.shots.map((s, i) => (i === 0 ? 0 : s.transitionBeats != null ? s.transitionBeats * beat : s.transition ?? 0));
  let cut = 0;
  return sb.shots.map((_, i) => {
    const next = cut + lens[i]!;
    const start = Math.max(0, cut - overlaps[i]! / 2);
    const end = i === sb.shots.length - 1 ? next : next + overlaps[i + 1]! / 2;
    cut = next;
    return { start, end };
  });
}
