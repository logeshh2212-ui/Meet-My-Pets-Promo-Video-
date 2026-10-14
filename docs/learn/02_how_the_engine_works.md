# 2. How the engine works: from a browser tab to an MP4

This chapter follows **one frame** from code to file. Read it slowly, with the files open.

## 2.1 The tools we stand on (the "platform")

| Tool | What it is | Why we use it |
|---|---|---|
| **TypeScript** | JavaScript with types (`x: number`) | Catches mistakes before running; easier to read |
| **Browser + WebGL** | Chrome's built-in way to use the **GPU** (graphics card) from JavaScript | Fast drawing of millions of pixels, 3D, shaders |
| **three.js** | A library on top of WebGL: scenes, cameras, meshes, lights, materials | Writing raw WebGL is like assembly; three.js is like a framework |
| **Canvas 2D** | The browser's simple drawing API (`fillText`, `arc`, `drawImage`) | Text, UI drawings, paw taps. Easy and crisp |
| **Vite** | A dev server + bundler | Serves the app at `localhost`, reloads on save |
| **Bun** | A fast JavaScript runtime (like Node.js) | Runs our scripts: `prep-launch.ts`, `render.ts`, `sfx.ts` |
| **Playwright** | Controls a real browser from a script | Opens the film page **headless** (invisible) for rendering |
| **ffmpeg** | The Swiss-army knife of audio and video | Turns raw frames into H.264 MP4, cuts and mixes audio |

> **GPU vs CPU, simply:** the CPU is a few very smart workers; the GPU is thousands of simple workers. Colouring 2 million pixels, 60 times a second, is a perfect job for thousands of simple workers.

## 2.2 Boot: what happens when the page opens

File: [`app/src/main.ts`](../../app/src/main.ts) → [`app/src/engine/engine.ts`](../../app/src/engine/engine.ts) `init()`

1. **Load the data**: `data/audio.json` (the beat grid, length), `data/lyrics.json` (empty for us; P(doom) had every sung word), and all **fonts**.
2. **Build the timeline**: [`timeline.ts`](../../app/src/timeline.ts) reads [`storyboard.launch.json`](../launch-film/storyboard.launch.json) and returns a list of **entries**: `{ id: 'S04', start: 9.933, end: 13.244, load: () => import('./scenes/film-s04.ts') }`.
3. **Load each scene**: for every entry, import its file, create the scene object, and run its `init()` (load images, cut widgets, build 3D objects). This happens **once**, not every frame.
4. Then either start the **preview player** (play/pause, scrub bar) or wait for the **export script** to ask for frames (`?export=1` in the URL).

## 2.3 A scene: the unit of the film

Every shot is a **Scene** ([`engine/scene.ts`](../../app/src/engine/scene.ts)): a class with two important methods:

```ts
class MyShot extends Scene {
  async init() { /* once: load images, build objects */ }
  render(f: Frame, out: RenderTarget) { /* every frame: draw time f.t into `out` */ }
}
```

`f` (the **Frame**) carries everything a scene needs to know about "now":

| Field | Meaning |
|---|---|
| `f.t` | film time in seconds |
| `f.lt` | **local** time: seconds since *this shot* started (most of our code uses this) |
| `f.p` | progress through the shot, 0 → 1 |
| `f.beat`, `f.beatPhase` | which beat we're on, and how far into it (0 → 1). Used for the beat punch |
| `f.a` | audio features (loudness, bass …) |

`out` is a **render target**: an invisible picture in GPU memory that the scene must fill completely.

## 2.4 Rendering one frame (the heart)

`engine.render(t)` → `composite(t)`:

```
   time t
     │
     ▼
 which timeline entries cover t?          ← usually one; two during an overlap
     │
     ▼
 scene.render(frame, rt)                   ← each draws into its own HDR render target
     │      (our shots: backdrop → 3D stage → 2D overlay; see 2.6)
     ▼
 transition mix (if two scenes overlap)    ← fade / zoom / whip / flash shader
     │
     ▼
 motion blur accumulation (export only)    ← render several sub-frames, average them (2.5)
     │
     ▼
 post-processing  (post.ts)                ← exposure, bloom (glow), vignette, grain,
     │                                       chromatic aberration, ZOOM (our beat punch)
     ▼
 HUD layer (hud.ts)                        ← P(doom)'s readout; switched off in our film
     │
     ▼
 final image on the canvas (sRGB)
```

**HDR render targets.** The scenes draw into *HalfFloat* targets: colours can go above 1.0 ("brighter than white"). Post-processing uses that for **bloom**: anything brighter than a threshold glows. It also explains why we turned bloom down for the white app screens: they would have glowed.

**Linear vs sRGB colour.** Inside the engine colours are **linear** (maths works correctly: 0.5 really is half the light). At the very end they're converted to **sRGB**, the curve screens expect. Canvas 2D layers are sRGB and get converted when uploaded. *If colours ever look washed out or too dark, suspect a colour-space mix-up.*

## 2.5 Motion blur: why a frame is many frames

A real camera keeps its shutter open for a moment, so fast things smear. Our engine imitates that. To make **one** frame it renders **several sub-frames** at slightly different times inside the "shutter" and **averages** them:

```
frame at t = 10.000 s, shutter 0.3 → sub-frames spread over ±0.0025 s
  t=9.9975 ─┐
  t=9.9992 ─┤  average  →  one frame with a smooth motion streak
  t=10.0008 ┤
  t=10.0025 ┘
```

- `--samples 2` → 2 sub-frames. Fast objects show **two copies** (we saw this as "doubled text").
- `--samples 4` → 4 copies, closer together.
- `--samples auto` → **adaptive**: the engine keeps adding sub-frames (4, 12, 36 …) only where the picture still changes. It divides the frame into **32×32 tiles** and stops refining tiles that have converged. Converged tiles are skipped cheaply through the GPU depth buffer ("early-Z"). Our final film used `auto` up to 36, so every fast move is a smooth streak.

This is why the engine insists on **determinism**: sub-frames are rendered *out of order*, so a scene must never depend on "what I drew last time". It must depend only on `t`.

## 2.6 How our shots draw (the Shot base class)

All MeetMyPets shots extend [`scenes/_shot.ts`](../../app/src/scenes/_shot.ts), which fixes the order of layers:

```
1. backdrop   (Canvas 2D, drawn once)        the act's colour gradient   (_world.ts)
2. 3D stage   (three.js scene)               widgets, phone, stickers, floating decor, floor shadows
       └─ rendered into a 4× MSAA target (smooth edges), then laid over the backdrop
3. overlay    (Canvas 2D, every frame)       headline text, paw taps, flashes, wipes
4. post       (returned settings)            bloom, vignette, grain, and `zoom` = the beat punch
```

A subclass only writes three methods:
- `setup()`: load images, cut widgets, build the world
- `frame(lt)`: move the camera and widgets; repaint widget states
- `overlay(c, lt)`: draw 2D on top

## 2.7 Export: how frames become an MP4

File: [`app/scripts/render.ts`](../../app/scripts/render.ts)

```
 render.ts (Bun)                                      Chrome (headless, ×2 workers)
 ───────────────                                      ─────────────────────────────
 start a private Vite server (no live reload)
 launch 2 headless Chromes ──────────────────────►   open  /?export=1&only=S04
 split frames into chunks of 8                        engine.init()
 "render frames 600..607" ───────────────────────►   for each frame: engine.render(t, samples)
                                                       read pixels from GPU (async, fenced)
            ◄──────────── RGB bytes over a WebSocket ─ (sent from a Web Worker)
 put frames back in order (reorder buffer,
   spill to disk if memory is full)
 write raw RGB to ffmpeg stdin ─────►  ffmpeg: rawvideo rgb24 → vflip → BT.709 colour
                                       → libx264 (H.264) → MP4 (+ music if not --noaudio)
```

Words you'll meet:
- **Headless browser**: a real Chrome with no window. It still uses the GPU.
- **WebSocket**: a two-way pipe between the page and the script, used to stream big frames fast.
- **Reorder buffer**: two workers finish chunks out of order; frames are held until the next one in sequence arrives.
- **vflip**: WebGL reads pixels bottom-up, so ffmpeg flips them.
- **BT.709**: the colour standard for HD video. Tagging it correctly keeps YouTube's colours identical to the preview.
- **CRF 17**: H.264's quality knob (lower = better and bigger; 17–18 is "visually lossless").

## 2.8 The 2D/3D toolbox, in one table

| File | What it gives you |
|---|---|
| [`engine/gl.ts`](../../app/src/engine/gl.ts) | `Layer2D` (a Canvas 2D surface → GPU texture), `makeRT` (render targets), `Compositor.draw` (lay one image over another), `W`, `H` (1920×1080) |
| [`engine/post.ts`](../../app/src/engine/post.ts) | bloom, vignette, grain, chromatic aberration, zoom, shake, flash, fade |
| [`engine/type.ts`](../../app/src/engine/type.ts) | fonts (Archivo, Plex Mono, Cormorant + our Bricolage, Nunito Sans, Love Ya Like A Sister), text measuring |
| [`engine/util.ts`](../../app/src/engine/util.ts) | `clamp`, `lerp`, `prog`, `ease.*`, seeded random (`mulberry32`) |
| [`engine/audio.ts`](../../app/src/engine/audio.ts) | beats/bars from `data/audio.json`, `beatAt(t)` |
| [`scenes/_cine.ts`](../../app/src/scenes/_cine.ts) | `Phone3D` (metal phone with a live screen), `makeStage` (lights + camera), backdrops |

## 2.9 Check yourself

1. Why can the preview jump straight to 17.3 s?
2. Why did `--samples 2` show doubled text, and what fixed it?
3. In which order are the backdrop, the 3D stage and the headline drawn, and why that order?
4. What would break if a scene stored "the position from the last frame" in a variable and moved it a bit each frame?

<details><summary>Answers</summary>

1. Every frame is a pure function of `t` (deterministic), so no history is needed.
2. 2 sub-frames = 2 visible copies of fast objects. Adaptive sampling (`--samples auto`) adds sub-frames until the streak is continuous.
3. Back to front, like painting: background first, then 3D objects, then text on top so it's never hidden.
4. Sub-frames are rendered out of order and the preview can seek, so that position would be wrong (and differ between preview and export). Compute position from `t` instead.
</details>

**Next:** [3. From P(doom) to MeetMyPets →](03_pdoom_to_meetmypets.md)
