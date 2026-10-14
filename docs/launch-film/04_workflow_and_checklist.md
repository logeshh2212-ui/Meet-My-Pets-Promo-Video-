# 6. Animation and compositing workflow

**Key idea:** split the film by *what must be exact*.

- **The app UI must be pixel-true.** It comes from Figma or the real app, never from an image model.
- **Depth and light** come from real 3D.
- **Pets and atmosphere** come from photographs (generated plates), animated in 2.5D.

## 6.1 What each element is made from

| Element | Made as | Why |
|---|---|---|
| Phone (S04, S08–S20) | **Real 3D model** (licensed, generic, no brand logos); screen = separate emissive material | Real reflections, metal edges, ambient occlusion and orbits. A still plate can't orbit |
| UI layers floating in depth (header, cards, buttons, nav, bubbles) | **Flat Figma exports on 3D planes** at different depths (z) | Gives believable depth and parallax while keeping text sharp and undistorted |
| Swiped cards, coin, chat bubbles, S20 screen cards | **3D slabs** (UI texture on the front, 4–8 px thickness, rounded edges) | They cast shadows and catch light as they fly |
| **The Two Loops** (Shiro's coral, Tom's amber; every shot) | **3D tubes along animated curves** (Blender curve + bevel, or engine splines), same stroke weight as the logo | They do the transitions and become the logo, so they must be real 3D with light and shadow. Build them from the two paths in `mmp_mark.svg`, so the end lock-up matches exactly |
| Double-loop symbol (S13–S15) and logo (S03, S21) | **Official SVGs** in `app/public/assets/brand/`: `mmp_mark.svg` (app/UI), `mmp_mark_film.svg` (woven end lock-up) | The two loop-lines must land exactly on these paths |
| Typography | **2D motion graphics**, Bricolage Grotesque (headlines) + Nunito Sans (subs), the app's own fonts | Crisp, kerned, never generated |
| Paw-taps, ripples, chips, counters, typing, typing dots | **2D UI animation** over the layered screens; the paw-tap glyph from the app's `Paw.svg` | Matches the real app behaviour |
| Tag type (collar-tag pills) | **2D**, damped-pendulum swing (about 0.5 s, 2 swings) | Our own type system |
| Pet photos (S01, S02, S19) | **2.5D**: plate + depth map → parallax, plus a matte for light wrap | Real camera feel from one still |
| Particles, light leaks, flares, bloom | **2D compositing**, used sparingly | Supports the moment, never hides UI |

## 6.2 Getting the real screens (Figma / app)

1. In Figma, set the **story content** first (see README Q3):
   - Shiro's avatar = P07.
   - Discover card 3 and the match screen = Tom (P08).
   - Tom's Feed post = P09.
   - Fix the "Shibha" typo.
2. Export at **4x** as PNG (the current crops are 2x, 660×1433). Export icons and the double-loop as **SVG**.
3. Export **layers separately**, not just flat screens:
   - **Create:** header, photo circle (empty / filled), form card, each field (empty / focus / filled), gender chips (both states), completion capsule, Save bar.
   - **Discover:** base screen with an empty card area, card 1 / 2 / 3, heart stamp, each action button (normal / pressed), nav bar.
   - **Pet profile:** one tall export covering the full scroll length.
   - **Feed:** base, post photo **separate from** its overlay controls, Liked / Following states, the next post.
   - **Match:** dim layer, double-loop, title, subline, both buttons.
   - **Chat:** header, thread, each bubble, typing indicator, input bar.
4. For scrolls and swipes, also **screen-record the real app** at 60 fps (Android emulator or iOS simulator). Use it as the timing and physics reference, or directly inside the phone in S13.

## 6.3 Putting a real screen onto the phone

- **3D route (recommended):**
  1. Map the screen PNG to the phone's screen material with UVs 0–1.
  2. Make it emissive at a calibrated brightness, so UI white ≈ 92% on output.
  3. Put a separate glass layer on top: reflection at 10–20% plus a faint fingerprint-free gloss.
- **Plate route (P04 fallback):**
  1. Key out the green screen.
  2. **Corner-pin** the screen to the 4 corners.
  3. Mask it with the phone's corner radius.
  4. Add the reflection on top in Screen blend mode at 10–15%.
  5. Match grain and blur.
- Never warp UI with mesh or liquify. Keep the screen texture at least as large as it appears on the output, so text never gets blurry.

## 6.4 Separate layers and masks you need

- **Mattes:** Shiro in P02 and P10, Tom in P10. Use a background remover, then refine the fur edge.
- **Depth maps:** P01, P02 and P10. Generate them with Depth Anything V2.
- Rounded-rectangle masks for cards and the phone screen.
- The **paw-tap** glyph: a soft paw-pad (from `Paw.svg`), 90% opacity, with a squash and a ripple. Place it slightly below the tapped control, so it never covers the label.
- The double-loop as two separate paths, so each loop can draw on its own.

## 6.5 Camera

- **One virtual camera rig** for all phone shots, inside the shared studio environment (P05 / P06). The cuts then feel like one continuous world.
- **Eases:**
  - `outExpo` for entrances (dolly-outs, the phone rotation)
  - `inOutCubic` for orbits
  - springs with a little overshoot for UI
  - no linear moves, except slow drifts
- Hidden cuts (S05→S06→S07) keep the camera's velocity across the cut.
- **Motion blur:** a 180° shutter (half the frame time). Add extra blur only on fast whips and card flights.
- **Depth of field:** only on macros (S01, S06, S14). The UI must always be readable at its key moment.

## 6.6 Syncing to the music

- **`storyboard.launch.json` is the master timing.** Every shot and sync event has a frame number (`start_frame`, `audio_sync[].frame`).
- Put markers at those frames in your editor or engine before you animate anything.
- **Cuts** land on the downbeat frame. **Transitions** run in the `transition_window`, the last 0.33 s of the outgoing shot.
- **SFX:**
  - very few, on their own track, −18 to −24 dB under the music
  - the one match chime at −14 dB, tuned to the track's key
  - don't compress or re-time `testing.mp3`

## 6.7 Two practical production routes

| | Route A: this repo's engine + Blender passes (recommended) | Route B: Blender + After Effects |
|---|---|---|
| Timing | The engine renders each frame from the timeline and muxes `testing.mp3`, so sync is frame-exact | AE markers from the JSON |
| 3D phone, slabs, ribbons | Rendered in Blender as RGBA image sequences, layered in the engine (or a real 3D phone added to the engine later) | Blender renders, composited in AE |
| Still to build | Real per-shot scenes, layered-screen support (the engine already renders 1920×1080 from the JSON timeline) | Nothing new, but every animation is keyed by hand |

Both routes finish with the same 60 fps export (6.8).

## 6.8 Where AI video helps, and where it doesn't

- ✅ **Use it for:** 2–4 s of subtle life in the pet plates (S01 blink, S02 ear/tail, S19 play). Generate it, then conform it to 60 fps with optical flow. Check that the pet's face, coat and collar match P07 / P08 frame by frame.
- ❌ **Don't use it for:** UI, the phone, the logo, text, the swipe or the match. A single image-to-video generation will **not** produce a correct 76-second product demo. It distorts text and invents controls.

## 6.9 Render and export

- Render a **PNG sequence at 1920×1080, 60 fps constant**, frames 0–4567 (4568 frames). For cleaner edges, render at 2x and downscale.
- Encode and add the audio:

```bash
ffmpeg -framerate 60 -i frames/%05d.png -i audio/testing.mp3 -map 0:v -map 1:a -c:v libx264 -preset slow -crf 16 -profile:v high -pix_fmt yuv420p -r 60 -c:a aac -b:a 320k -shortest -movflags +faststart out/meetmypets_launch_1920x1080_60p.mp4
```

---

# 7. Final production checklist

Run these on the finished file (replace the path if yours differs):

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,avg_frame_rate,nb_frames -of default=nw=1 out/meetmypets_launch_1920x1080_60p.mp4
```

```bash
ffprobe -v error -show_entries format=duration -of default=nw=1 out/meetmypets_launch_1920x1080_60p.mp4
```

```bash
ffmpeg -i out/meetmypets_launch_1920x1080_60p.mp4 -vf blackdetect=d=0.03:pix_th=0.06 -an -f null -
```

| ✔ | Check | Pass when |
|---|---|---|
| ☐ | Duration | 76.13–76.15 s; 4568 video frames |
| ☐ | Frame rate | `r_frame_rate` and `avg_frame_rate` both 60/1 (constant) |
| ☐ | Resolution | 1920×1080, square pixels, yuv420p |
| ☐ | Audio sync | At frame 2832 the double-loop starts drawing exactly on the drop; at frame 4322 the logo hits with the final downbeat; spot-check 5 random cuts against downbeats |
| ☐ | Interface accuracy | Every screen traces back to a Figma or app export; no invented buttons, labels or icons; "It's a Match!", "Tom liked you back.", "Chat Now" and "Continue Discovering" match the app |
| ☐ | Story data consistent | Tom's name, photo and breed are the same on his card, profile, post, match and chat; Shiro's avatar = P07 everywhere |
| ☐ | Legible type | Every headline is on screen ≥ 1.2 s and ≥ 40 px tall at 1920×1080; nothing sits on the phone's UI; inside the 5% title-safe area (96 px left/right, 54 px top/bottom); keep the bottom 90 px free of key text (YouTube player controls) |
| ☐ | Brand | Only #FF1744 / #FF7A00 / #FFC107 accents on the warm-white #FFFAFA; app fonts; the official logo file |
| ☐ | Pet appearance | Shiro: cream coat, red collar + gold tag in every shot. Tom: golden coat, green collar. Same faces across plates |
| ☐ | Smooth transitions | Every transition sits inside its window; no pops or jumps on hidden cuts; motion blur on fast moves only |
| ☐ | No invented features | No photo-picker sheet, comment sheet, maps, health, booking or reminders shown (they aren't in the supplied designs) |
| ☐ | No distorted UI | Screens are only scaled, rotated or perspective-mapped as flat planes, never warped |
| ☐ | No glitches | `blackdetect` finds only 0.00–0.67 (the intended ember open, if dark enough to trigger); no single-frame flashes except the 2-frame heart stamps at the swipe cuts (5.49, 31.98, 65.09) and the loop interlock at 47.21 |
| ☐ | Final frame | From 74.84 to the last frame: logo, wordmark, tagline and badges fully visible and still |
