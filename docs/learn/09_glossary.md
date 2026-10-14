# 9. Glossary

Every technical word in this guide, in plain language.

| Term | Plain meaning |
|---|---|
| **Animatic** | a rough draft of a film, used to judge timing and story before the polish |
| **Autocorrelation** | sliding a signal against itself to find how often it repeats (used for tempo) |
| **Bar** | a group of beats (here 4 beats = 3.311 s) |
| **Beat / BPM** | the pulse of the music / how many pulses per minute |
| **Beat punch** | a tiny zoom on every beat that makes the picture "pulse" with the music |
| **Bloom** | a glow around bright parts of the image |
| **Bun** | a fast JavaScript/TypeScript runtime; runs our scripts |
| **Canvas 2D** | the browser's simple drawing API: rectangles, text, images |
| **CI (Continuous Integration)** | servers that test code automatically on every change |
| **Chromatic aberration (CA)** | colours separating slightly at the edges, like a real lens |
| **Contact sheet** | many still frames in one image, to review a shot at a glance |
| **CTC forced alignment** | finding *when* known words are sung, using letter probabilities from a model |
| **d3d11 / Metal / ANGLE** | graphics backends: Direct3D 11 (Windows), Metal (Mac); ANGLE translates WebGL to them |
| **Demucs** | a neural network that splits a song into vocals, drums, bass and other |
| **Design units** | Figma's coordinate units; our phone frame is 393 × 852 |
| **Deterministic** | the same input always gives the same output (frame = function of time) |
| **Downbeat** | the first, strongest beat of a bar |
| **Drop** | the moment the full music returns after a quiet section |
| **Easing** | how motion speeds up or slows down (e.g. `outExpo` = fast start, soft stop) |
| **Extrude** | turn a flat 2D shape into a 3D object by giving it depth |
| **ffmpeg / ffprobe** | the command-line tool for video/audio processing / for inspecting files |
| **Figma** | the design tool where the app's screens were made |
| **Frame / fps** | one still image of the video / frames per second (we use 60) |
| **Gloss / sheen** | a soft light highlight that makes a surface look shiny |
| **Headless browser** | a browser running without a window, controlled by a program |
| **HDR / linear colour** | rendering with values above "white" and in physically correct maths before converting for the screen |
| **HMR (Hot Module Reload)** | a dev server feature that updates the page when code changes |
| **Keyframe** | a stored value (e.g. camera position) at a time; the code fills in between |
| **Keying (key out)** | making one colour transparent, like a green screen |
| **LLM** | Large Language Model, e.g. Claude; reads and writes text |
| **libx264 / H.264** | the common video compression format and its encoder |
| **librosa** | a Python library for audio analysis |
| **Mesh / material / texture** | a 3D shape / how its surface reacts to light / an image painted on it |
| **moov atom** | the index inside an MP4; without it the video won't play |
| **Motion blur** | the smear of fast motion; we create it by averaging sub-frames |
| **MSAA** | multisample anti-aliasing: smooth edges by sampling each pixel several times |
| **Onset** | the moment a sound starts |
| **Parallax** | near things move more than far things when the camera moves |
| **Playwright** | a library to control browsers from code |
| **Post-processing** | effects applied to the finished image (bloom, grain, vignette, zoom) |
| **Premultiplied alpha** | storing colour already multiplied by transparency; mixing the two conventions causes dark edges |
| **Render target (RT)** | an off-screen image the GPU draws into |
| **RMS** | a measure of loudness over a short window |
| **Schema / validation** | a formal description of valid data / checking data against it |
| **Shadow map** | an image from the light's point of view used to compute shadows |
| **Shot** | one continuous piece of the film between cuts (we have 9) |
| **Shutter** | the fraction of a frame's time used for motion blur |
| **SFX** | sound effects |
| **sRGB** | the standard colour space for screens |
| **Storyboard** | the plan of shots with timing; here a JSON file that drives the film |
| **Structured output** | asking an LLM to answer in a fixed JSON format |
| **SwiftShader** | Chrome's software (CPU) renderer: works everywhere but slow |
| **three.js** | a JavaScript 3D library on top of WebGL |
| **TypeScript** | JavaScript with types, which catch mistakes before running |
| **Vignette** | darkening at the image corners to focus attention |
| **Vision-language model** | an AI model that understands images and text together |
| **Vite** | a fast dev server and bundler for web projects |
| **WebGL** | the browser's API for using the GPU |
| **WebSocket** | a two-way connection between a page and a program; carries our frames to ffmpeg |
| **Whisper** | a speech-recognition model that can give word timestamps |
| **Widget** | in this project: a crop of a Figma screen turned into a 3D object with states |
| **World units** | the 3D scene's units (y up, z towards the camera) |

**Back to:** [the start](README.md)
