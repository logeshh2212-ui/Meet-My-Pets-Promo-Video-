# 3. From P(doom) to MeetMyPets: the journey

This is the story of how a music-video engine became a product-launch film, **in the order it happened**, with the reason for each decision. Real projects look like this: plans change, feedback arrives, problems appear. Learning *why* each change happened teaches more than the final code alone.

## 3.1 Where we started: the P(doom) engine

The engine was built for the music video *"I'm Upping My P(doom)"*. What it already had:

- **Deterministic rendering** of any time `t` (chapter 2), preview + export with the same code.
- **Motion blur** by sub-frame averaging, with adaptive per-tile refinement.
- **Post-processing**: bloom, halation, grain, chromatic aberration, vignette, flash, zoom, shake.
- **A HUD** that showed a "P(doom)" number ticking up through the song.
- **Lyrics data**: every sung word with its start/end time, produced by an **AI audio pipeline** (chapter 4).
- **~30 hand-written scenes** ("plates"): `loss.ts`, `fuse.ts`, `shoggoth.ts`, `room.ts` … each a little art piece.
- **Export** via headless Chrome → WebSocket → ffmpeg, at 1080p or 4K.

All of that is still in the repo: the old scenes sit in `app/src/scenes/` (they're simply not in the timeline any more). That is normal in real projects: you build on a strong foundation instead of starting from zero.

## 3.2 Stage 1: the plan (before any code)

**Request:** a professional launch film for MeetMyPets, with a full production package.

What we did first, **before building**:
1. **Measured the music** instead of guessing a BPM (chapter 4). The old `data/audio.json` said 97 BPM and was **wrong**: it had picked up a dotted rhythm. The real grid: a bar every **3.311 s**, the drop at **47.21 s** in the full track.
2. **Read the real app's code** (the Flutter project) to know which features *really exist*, so we wouldn't invent features. Chat, match, feed, discover and create profile are real; health tracking and booking are not, so they're not shown.
3. Wrote the production plan: storyboard, image prompts, workflow, checklist → [`docs/launch-film/`](../launch-film/README.md).

**Lesson:** *measure, don't assume; verify features against the source of truth.* That's an engineering habit, not a video habit.

## 3.3 Stage 2: brand and references

- **The logo**: the double-loop was rebuilt as clean SVGs from the app's own vector file, plus a "woven" film version → [`app/public/assets/brand/`](../../app/public/assets/brand/).
- **A reference video** (a SaaS launch ad) was studied frame by frame. Your feedback: *"I don't need the exact thing … build uniquely."* So we kept only its **principles**:
  - morph instead of cut
  - one idea per beat
  - the logo earned from something seen earlier

  and invented our own devices: the **Two Loops** (Bubbly's coral loop + Lily's amber loop = the logo), **paw-taps**, **collar-tag type**, and **swipe cuts**.

**Lesson:** use references for *principles*, never for copying.

## 3.4 Stage 3: real screens instead of mock-ups

- You exported the **Figma screens** → [`app/public/assets/figma/`](../../app/public/assets/figma/). We analysed every file ([`SCREEN_ANALYSIS.md`](../launch-film/SCREEN_ANALYSIS.md)) and found sample-data problems ("Ruby · Maine Coon" on a dog photo, a leftover "Error message" note).
- The missing **"It's a Match!"** screen was **rebuilt in HTML** from the app's exact strings and rendered to a 4× PNG → [`figma_rebuilt/match.html`](../../app/public/assets/figma_rebuilt/match.html).
- Fonts: the app's **Bricolage Grotesque** and **Nunito Sans**, plus **Love Ya Like A Sister** for the wordmark (your choice).

## 3.5 Stage 4: the first build: an "animatic"

**Changes:**
- [`engine/gl.ts`](../../app/src/engine/gl.ts): the frame size (it went to 9:16 and then back to **16:9** when you said *"this is for YouTube"*).
- [`scripts/prep-launch.ts`](../../app/scripts/prep-launch.ts): writes the **measured** beat grid and the soundtrack.
- [`timeline.ts`](../../app/src/timeline.ts): reads the **storyboard JSON** directly, so one file drives the edit.
- [`scenes/film.ts`](../../app/src/scenes/film.ts): an **animatic**, a rough version of all shots: the real screens on a 3D phone plus text.

**Your feedback:** *"a single mobile coming from down to up is boring … make the app interactive … like a story from sign-in."*

**Lesson:** an animatic is *meant* to be criticised early. It is cheap to change direction at this point.

## 3.6 Stage 5: the interactive-widget idea

The key invention: [`scenes/_ui.ts`](../../app/src/scenes/_ui.ts), the **widget kit**.

> A **Widget** is a rectangle cut **pixel-exact** from a Figma export (e.g. the email field), placed in 3D. It can sit on the phone's screen, lift off it, fly to the camera, and be **repainted** to show a new state (typed text, a focus ring, a pressed button).

```ts
const email = new Widget(loginImage, [31, 344, 332, 44], { radius: 22 });   // x, y, w, h in Figma units
email.draw((c) => { c.fillText(typed('pawrent@pawmail.com', lt, 0.25, 0.045), 47, 366); });  // type it
drawPawTap(c, ...email.toFrame(cam, 110, 366), lt - 0.25);                   // the paw that taps it
```

The first test (Sign in, exploded phone) was promising.

**Your feedback:** *"reduce the video to 30 s … too slow, remember the P(doom) video … start with text that becomes the logo … interactive for all features."*

## 3.7 Stage 6: the 30-second cut

- **The music cut:** we found a 30.6 s window that needs **no editing**. It starts on a measured downbeat (45.553 s), the drop lands at 1.656 s, and the track's own ending finishes the film.
- **Nine shots of one bar each** (3.311 s), with a change on every beat → [`storyboard.launch.json`](../launch-film/storyboard.launch.json), generated by a Python script so the times always add up.
- **The cast from the designs:** Bubbly (golden retriever) and Lily (Aussie). So **no new photos** were needed.
- **A shared base** for shots: [`scenes/_shot.ts`](../../app/src/scenes/_shot.ts) (camera keyframes, headlines, layers).

## 3.8 Stage 7: the enhancement pass ("lots of enhancement")

You asked for every enhancement group, plus *"different camera angles and new styles for showing features, not just a mobile screen"*:

| Shot | Old idea | New idea | New code |
|---|---|---|---|
| Sign in | exploded phone | **giant keyboard world** | `Keyboard` in [`_kit.ts`](../../app/src/scenes/_kit.ts) |
| Profile | phone lying flat | **polaroid desk** (polaroid, collar tag, medal, trait blocks) | [`film-s03.ts`](../../app/src/scenes/film-s03.ts) |
| Feed | one post | **endless scroll wall** + a 3D extruded heart | [`film-s04.ts`](../../app/src/scenes/film-s04.ts) |
| Discover | cards fan | **carousel ring** | [`film-s05.ts`](../../app/src/scenes/film-s05.ts) |
| Match | loops on a screen | **face to face stickers** + notification banner | `sticker`, `banner` in `_kit.ts` |
| Chat | side of a phone | **conversation in the air** | [`film-s07.ts`](../../app/src/scenes/film-s07.ts) |

Plus, for all shots:
- **Worlds per act**: gradient + floating paw/loop decor + a shadow floor → [`_world.ts`](../../app/src/scenes/_world.ts).
- **Slabs**: widgets got real thickness, a sheen and shadows (`Widget.slab()`).
- **Beat punch**: a small zoom on every beat, via the engine's post `zoom`.
- **MSAA**: the 3D stage renders into a 4× multisampled target, for smooth edges.
- **Sound effects**: synthesised in code and placed on every action → [`scripts/sfx.ts`](../../app/scripts/sfx.ts).

## 3.9 Stage 8: making rendering work on your PC

The best design is useless if it can't render. The problems we hit (details in chapter 6):

| Problem | Cause | Fix |
|---|---|---|
| Rendering ~1 s per frame | The script forced `--use-angle=metal` (a **Mac** flag), so Chrome fell back to **SwiftShader** (software, CPU) | Choose the backend per OS: `d3d11` on Windows. **~6× faster** |
| "Execution context was destroyed" | The render used a dev server with **live reload**; the page reloaded mid-render | Always use the render script's private server (`--url http://localhost:5999`) |
| "Target crashed", "fence wait failed" | **GPU memory**: 9 heavy scenes loaded in one page, each with big textures, shadow maps and its own MSAA target, on an integrated GPU | Share one MSAA target, smaller shadow maps, and **render one shot at a time** (`--only S0N`), then join |
| Doubled text in fast moves | Only 2 motion-blur sub-frames | Adaptive sampling (`--samples auto --max-samples 36`) |
| Audio peaking at 0 dB | The limiter's auto-level pushed the level back up | `alimiter=...:level=0` |
| 31 leftover servers | On Windows, killing `bunx` doesn't kill its child `node` | Kill the whole process tree (`taskkill /T`) |

**Lesson:** a big part of real engineering is making things work **on the actual machine**, then writing the fix down so nobody hits it again.

## 3.10 The final pipeline

```
bun scripts/prep-launch.ts                      # music cut + beat grid
for each shot S01..S09:
  bun scripts/render.ts video --only S0N --from <start> --to <end> \
      --samples auto --max-samples 36 --shutter 0.3 --noaudio --out out/parts4/s0N.mp4
ffmpeg -f concat ... → video_only.mp4            # join the 9 shots (1835 frames)
bun scripts/sfx.ts --mux video_only.mp4 MeetMyPets_30s_v3.mp4   # music + effects
```

**Next:** [4. Music and timing →](04_music_and_timing.md)
