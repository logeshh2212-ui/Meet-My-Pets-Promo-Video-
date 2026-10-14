// The edit of the MeetMyPets launch film, read from docs/launch-film/storyboard.launch.json.
// Every shot has measured start/end times (cut on the music's downbeats, back to back), so the
// windows touch and the engine makes hard cuts; each shot designs its own transition inside its
// last 0.33 s (`transition_window` in the storyboard).
//
// Which scene draws a shot: scenes/film-<id>.ts (e.g. film-s05.ts) when that file exists, otherwise
// scenes/film.ts, the animatic that shows every shot with its real screens and copy.
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import storyboard from '../../docs/launch-film/storyboard.launch.json';

export type LaunchShot = (typeof storyboard.shots)[number];

// Scene modules are discovered lazily so a missing/broken scene never breaks the build.
const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const sceneFor = (id: string) => () => {
  const own = modules[`./scenes/film-${id.toLowerCase()}.ts`];
  const m = own ?? modules['./scenes/film.ts'];
  return m ? m() : Promise.reject(new Error('scene module not found: scenes/film.ts'));
};

export function makeTimeline(_ly: Lyrics, _au: AudioData): TimelineEntry[] {
  return storyboard.shots.map((s) => ({
    id: s.id, // "S01" … "S21" in the preview's scrub bar and for --only
    load: sceneFor(s.id),
    start: s.start,
    end: s.end,
    params: s,
  }));
}
