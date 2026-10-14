# Learning guide: from the P(doom) video engine to the MeetMyPets launch film

This guide is written for **you**, a fresher AI engineer. After reading it you should be able to:

1. **Understand** every part of this project: how a video can be *programmed* instead of edited.
2. **Explain** it confidently: in a 30-second pitch, a 2-minute walkthrough, or a deep technical interview.
3. **Change** it yourself: add a shot, change timing, fix a render problem.
4. **Grow** it into a product: an AI-powered *video generator*.
5. **Grow your career** from it: what you learned, what to learn next, and how to show it.

## Reading order

| # | Chapter | What you get | Time |
|---|---|---|---|
| 1 | [The big picture](01_big_picture.md) | What this project is, in plain words; the one idea that makes it work | 20 min |
| 2 | [How the engine works](02_how_the_engine_works.md) | From a browser tab to an MP4 file, step by step | 60 min |
| 3 | [From P(doom) to MeetMyPets](03_pdoom_to_meetmypets.md) | Everything that changed, why, and in which file: the journey | 45 min |
| 4 | [Music and timing](04_music_and_timing.md) | Beats, bars, the drop; how we *measured* the music, and how P(doom) used AI to do it | 40 min |
| 5 | [The shots, one by one](05_shots_walkthrough.md) | Each of the 9 shots and the building blocks (widgets, worlds, paw taps); a tutorial to add your own | 60 min |
| 6 | [Running, rendering, debugging](06_running_and_debugging.md) | Every command, and every problem we hit with its fix (real war stories) | 30 min |
| 7 | [Turning this into a video generator](07_video_generator_roadmap.md) | Architecture, the AI parts, phases from MVP to product | 45 min |
| 8 | [Your career guide](08_career_guide.md) | How to present this project, interview Q&A, skills map, a 12-month plan | 45 min |
| 9 | [Glossary](09_glossary.md) | Every jargon word, in one line | reference |

**Tip:** read chapters 1 → 2 → 3 first. Keep the code open next to the guide; every chapter links to the real files.

## The project in one breath

> We built a **30-second, 60 fps launch film for the MeetMyPets app entirely in code**. The film is a web page that can draw *any moment in time* on demand. A script opens that page in a hidden browser, asks it for frame 0, 1, 2 … 1834, and pipes the pictures into **ffmpeg**, which makes the MP4. Everything — camera moves, 3D cards made from the real Figma screens, paw taps, typing, sound effects — is a **function of time**, locked to beats we **measured** from the music.

## Where things are

```
meet-my-pets/
├── audio/testing.mp3          the music (the film uses 45.55 s → end of it)
├── data/audio.json            the beat grid the engine reads (written by prep-launch.ts)
├── docs/launch-film/          the production plan: storyboard, prompts, analysis
├── docs/learn/                ← this guide
├── analysis/                  P(doom)'s Python tools: AI music + lyric analysis
├── out/                       rendered videos (MeetMyPets_30s_v3.mp4 = the film)
└── app/                       the video engine (a web app)
    ├── index.html             the page
    ├── scripts/
    │   ├── prep-launch.ts     music cut + beat grid
    │   ├── render.ts          headless browser → frames → ffmpeg → MP4
    │   └── sfx.ts             sound effects synthesised in code, mixed under the music
    └── src/
        ├── main.ts            boots the engine (preview player or export mode)
        ├── timeline.ts        reads the storyboard → which scene draws which seconds
        ├── engine/            the core: rendering, post effects, audio data, fonts, maths
        └── scenes/            the film: film-s01.ts … film-s09.ts + shared kits (_shot, _ui, _kit, _world, _mark)
```
