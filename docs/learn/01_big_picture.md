# 1. The big picture

## 1.1 What did we make?

A **30-second launch film** for MeetMyPets, a social app for pets (Discover pets, like, match, chat). The film tells a story:

> Bubbly (your golden retriever) signs up → gets a profile → sees Lily's post in the Feed → finds Lily in Discover → they **match** on the music's drop → they chat → logo.

Every app feature is shown **interactively**: a piece of the real app (cut from the Figma designs) lifts out into 3D space, a paw taps it, and it reacts exactly as the app would.

The surprising part: **nobody opened a video editor**. There is no After Effects or Premiere project. The whole film is **TypeScript code** running in a web browser.

## 1.2 The one idea that makes it all work

> **A video is just a function of time.**
>
> `picture = draw(t)` where `t` is the time in seconds.

If you can write a function that, for *any* time `t`, draws exactly what the film shows at that moment, then:

- **Preview** = call `draw(t)` 60 times a second in the browser while the music plays.
- **Export** = call `draw(0)`, `draw(1/60)`, `draw(2/60)` … `draw(30.583)`, save each picture, glue them into an MP4.
- **Seek** = call `draw(17.3)` directly. No need to "play up to" 17.3 s.

This is called **deterministic rendering**: the same `t` always gives the same picture. That's why every animation in the code is written like this:

```ts
// the card arrives over 0.5 s starting at 0.2 s, with a smooth "ease out"
const k = ease.outExpo(prog(lt, 0.2, 0.7));     // k goes 0 → 1
card.position.x = lerp(2.6, 0.5, k);            // from x = 2.6 to x = 0.5
```

`prog(t, a, b)` turns "where are we between a and b" into a number from 0 to 1. `ease.outExpo` makes the motion fast at first and gentle at the end (like a real object). `lerp(a, b, k)` blends between two values. **These three tiny helpers drive almost every motion in the film.** (They live in [`app/src/engine/util.ts`](../../app/src/engine/util.ts).)

> **Simple analogy:** a flip-book. Each page is drawn from a rule ("on page 47 the dog is here"), not by copying the page before. You can open the book at any page.

## 1.3 Why build video with code at all?

| Editor (After Effects, Premiere) | Code (this project) |
|---|---|
| Every frame placed by hand | Every frame computed from rules |
| Change the music → re-time everything by hand | Change the beat grid → everything re-times itself |
| Hard to make 100 variants | Change a JSON file → a new video (→ a **video generator**) |
| Big binary project files | Text files: Git, code review, diffs |
| Great for one-offs | Great for **templates and automation** |

This is the same idea behind tools like **Remotion** (React video) and **Motion Canvas**. Our engine is a custom one, built first for a music video.

## 1.4 The two lives of this engine

**Life 1: the P(doom) music video.** The engine was first built for a music video called *"I'm Upping My P(doom)"* (a song about AI risk). That video is 2.5 minutes of "illustrated plates": an eye, a spark that writes lyrics, paperclips, a fuse … all drawn in code and synced **word by word** to the singing. Its style bible is in [`docs/TREATMENT.md`](../TREATMENT.md) and its engine manual in [`docs/ENGINE.md`](../ENGINE.md). To sync to the singing, it used **AI audio tools** (Demucs, Whisper, CTC alignment; see chapter 4).

**Life 2: the MeetMyPets launch film (this project).** We took the same engine (the repo's first commit is literally *"Start from the pdoom-video engine"*) and turned it into a **product launch film**:

```
P(doom) music video                         MeetMyPets launch film
───────────────────                         ──────────────────────
song with lyrics, 2.5 min        ──►        instrumental track, 30 s cut
synced to WORDS (AI alignment)   ──►        synced to BEATS (measured grid)
abstract illustrated plates      ──►        the real app UI as 3D "widgets"
1920×1080                        ──►        1920×1080 (briefly 9:16, then back for YouTube)
dark orange "doom" palette       ──►        coral / orange / amber brand palette
~30 hand-written scenes          ──►        9 scenes on shared "kits" + a storyboard JSON
```

Chapter 3 tells this journey step by step.

## 1.5 The layers, from the outside in

```
┌───────────────────────────────────────────────────────────────┐
│ 5. STORY      storyboard.launch.json — shots, times, copy      │  (what happens when)
├───────────────────────────────────────────────────────────────┤
│ 4. SHOTS      scenes/film-s01.ts … film-s09.ts                 │  (each shot's choreography)
├───────────────────────────────────────────────────────────────┤
│ 3. KITS       _shot (base) _ui (widgets) _kit (stickers,       │  (reusable building blocks)
│               keyboard, banner) _world (colour + decor) _mark  │
├───────────────────────────────────────────────────────────────┤
│ 2. ENGINE     engine.ts timeline + motion blur + post effects  │  (from P(doom))
│               gl.ts layers · type.ts fonts · audio.ts beats     │
├───────────────────────────────────────────────────────────────┤
│ 1. PLATFORM   browser · WebGL · three.js · Vite · Bun · ffmpeg  │  (tools we stand on)
└───────────────────────────────────────────────────────────────┘
```

When you explain the project, go **top-down** (story → shots → kits → engine → platform). When you debug, go **bottom-up**: is the platform OK (GPU, ffmpeg)? Then the engine? Then my shot?

## 1.6 What makes it "AI engineering"?

People sometimes think AI engineering = calling a chatbot API. Real AI engineering is building **systems** where AI and normal code work together. This project touches several parts of that:

1. **AI as a collaborator**: the whole build was done with an AI coding agent (Claude Code). You directed it, reviewed its renders, and corrected its course ("too slow", "like a slideshow", "build uniquely"). Directing an agent well is a core modern skill.
2. **AI in the pipeline**: P(doom) used AI models (Demucs for source separation, Whisper and CTC models for word alignment) to turn raw audio into timing data.
3. **Signal processing without AI**: for MeetMyPets we *measured* the beat grid with plain maths (loudness per frequency band), because a simple, explainable method was enough. Knowing **when not to use a model** is an engineering skill too.
4. **The next step**: a video *generator*, where a language model writes the storyboard JSON and the engine renders it (chapter 7).

**Next:** [2. How the engine works →](02_how_the_engine_works.md)
