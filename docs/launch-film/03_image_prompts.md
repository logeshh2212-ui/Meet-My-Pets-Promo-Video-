# 5. Image-generation prompts

One prompt = one image. Never ask the model for the logo, the app UI or any words: those are composited later from the real files.
Generate every full-frame plate at **16:9, 3840 x 2160** (or the model's largest 16:9 size, then upscale 2x) so camera push-ins stay sharp at 1920 x 1080. The in-app photos (P07 square, P08 3:4, P09 2:3) keep their own shapes.
Keep Shiro and Tom identical in every image: paste the same character description each time and, if your model supports it, use P07 (Shiro) and P08 (Tom) as reference images for the later prompts.

## P01 · `assets/film/p01_eye_macro.png`

- **Shots:** S01
- **Type:** pet photograph (background plate)
- **Aspect ratio:** 16:9 (generate 3840x2160, or the model's largest 16:9 size, then upscale)
- **Purpose:** Opening macro of the hero pet's eye; the camera pushes into the pupil.
- **Camera & composition:** Extreme macro, 100 mm macro look, eye level. The eye sits in the RIGHT third (65% across, 45% down); the left half is soft out-of-focus fur.
- **Lighting & colour:** Warm late-afternoon key light from frame right, a clear round catchlight at 2 o'clock in the eye, deep warm shadows, palette of cream, honey, ember orange.
- **Subject:** Shiro, a young adult cream Shiba Inu: pale cream-white coat with faint warm-biscuit shading on the ears and back, cream urajiro cheeks, small upright triangular ears, dark almond-shaped eyes, black nose and lips, tightly curled tail over the back, wearing a slim glossy red leather collar (#E8102E) with a small round brushed-gold tag. Only the area around one eye is visible: lashes, cream fur texture, the iris with fine detail.
- **Background:** Fur fills the frame; the far side falls into soft warm bokeh.
- **Space for type:** Left half, especially the lower-left, is soft low-detail fur (the title goes there).
- **Keep blank for compositing:** Nothing to keep blank; no reflections of people or cameras in the eye.

**Prompt (copy this):**

```text
Extreme macro photograph of the left eye of Shiro, a young adult cream Shiba Inu: pale cream-white coat with faint warm-biscuit shading on the ears and back, cream urajiro cheeks, small upright triangular ears, dark almond-shaped eyes, black nose and lips, tightly curled tail over the back, wearing a slim glossy red leather collar (#E8102E) with a small round brushed-gold tag. 16:9 wide frame. The eye sits in the right third of the frame, slightly above the middle; lashes and cream fur in razor-sharp detail around it, the left half of the frame falling into soft creamy out-of-focus fur. Warm late-afternoon sunlight from the right, a single round catchlight in the dark brown iris, honey and ember tones, cinematic colour grade, 100 mm macro lens at f/2.8. No text, no letters, no numbers, no logos, no watermark, no user interface, no phone unless described. Photorealistic, natural anatomy, correct number of legs and ears, no distortion.
```

## P02 · `assets/film/p02_doorstep.png`

- **Shots:** S02
- **Type:** pet photograph (background plate)
- **Aspect ratio:** 16:9 (generate 3840x2160, or the model's largest 16:9 size, then upscale)
- **Purpose:** Shiro on the doorstep looking out at the world: curiosity beat.
- **Camera & composition:** 35 mm, low camera at dog eye height. Shiro in the LEFT third on the doorstep; the street recedes to a vanishing point right of centre.
- **Lighting & colour:** Golden-hour backlight down the street, soft rim light on Shiro's fur, gentle haze.
- **Subject:** Shiro, a young adult cream Shiba Inu: pale cream-white coat with faint warm-biscuit shading on the ears and back, cream urajiro cheeks, small upright triangular ears, dark almond-shaped eyes, black nose and lips, tightly curled tail over the back, wearing a slim glossy red leather collar (#E8102E) with a small round brushed-gold tag, standing on a warm stone doorstep, body three-quarter to camera, head turned toward the street, ears up, alert and curious.
- **Background:** Quiet tree-lined residential street with low garden walls and potted plants, softly defocused, warm haze.
- **Space for type:** Upper-right 40% is calm sky and soft trees (the headline goes there).
- **Keep blank for compositing:** No people, no cars with readable plates, no house numbers or signs.

**Prompt (copy this):**

```text
Cinematic photograph, 16:9 wide frame. Shiro, a young adult cream Shiba Inu: pale cream-white coat with faint warm-biscuit shading on the ears and back, cream urajiro cheeks, small upright triangular ears, dark almond-shaped eyes, black nose and lips, tightly curled tail over the back, wearing a slim glossy red leather collar (#E8102E) with a small round brushed-gold tag, standing on a warm stone doorstep in the left third of the frame, head turned toward a quiet tree-lined residential street that recedes to a soft vanishing point right of centre. Low camera at dog eye height, 35 mm lens, f/2.8, golden-hour backlight down the street, warm haze, soft rim light on the cream fur. The upper right of the frame is calm sky and blurred foliage with little detail. No text, no letters, no numbers, no logos, no watermark, no user interface, no phone unless described. Photorealistic, natural anatomy, correct number of legs and ears, no distortion.
```

## P03 · `assets/film/p03_brand_gradient.png`

- **Shots:** S03
- **Type:** 3D render (background plate)
- **Aspect ratio:** 16:9 (generate 3840x2160, or the model's largest 16:9 size, then upscale) (your 9:16 version also works: it is a plain gradient)
- **Purpose:** Clean background for the brand reveal. The loop-lines and the logo are rendered on top, so the plate stays empty.
- **Camera & composition:** Straight-on, slight low angle, 50 mm equivalent, orthographic feel.
- **Lighting & colour:** Soft large studio light from the top centre, a gentle hotspot behind the logo position, very smooth falloff.
- **Subject:** No subject: an empty, softly lit coloured studio space.
- **Background:** Seamless gradient from warm coral-pink (#FF4D6D) at the top to soft orange (#FF8A3D) at the bottom, with a faint lighter glow at 40% height.
- **Space for type:** Entire plate is negative space.
- **Keep blank for compositing:** Completely empty: no ribbons, shapes, hearts or text.

**Prompt (copy this):**

```text
Empty seamless studio backdrop, 16:9 wide, photographic, ultra clean. Smooth gradient from warm coral-pink at the top to soft orange at the bottom, a gentle lighter glow behind the centre at about 40% of the height, soft large overhead light, very fine film grain, no objects, no shapes, nothing in frame. No text, no letters, no numbers, no logos, no watermark, no user interface, no phone unless described. Photorealistic, natural anatomy, correct number of legs and ears, no distortion.
```

## P04 · `assets/film/p04_phone_plate.png`

- **Shots:** S04
- **Type:** phone plate (optional fallback for a CG phone)
- **Aspect ratio:** 16:9 (generate 3840x2160, or the model's largest 16:9 size, then upscale)
- **Purpose:** Fallback product plate if the real 3D phone model is not ready. The real Figma screen is corner-pinned onto it.
- **Camera & composition:** Three-quarter view, phone rotated about 18 degrees, standing in the RIGHT third, phone height = 70% of frame height, 85 mm product lens.
- **Lighting & colour:** Large soft key from upper left, thin rim light along the metal frame, soft contact shadow and faint floor reflection.
- **Subject:** A modern unbranded smartphone with thin black bezels, rounded corners, a polished warm-silver aluminium frame and a small centred punch-hole camera.
- **Background:** Seamless warm studio sweep, off-white (#FFFAFA) blending to peach (#FFD9C7) near the floor.
- **Space for type:** Left half clean for copy.
- **Keep blank for compositing:** The screen must be a perfectly flat, uniform chroma green (#00B140) with no reflections or glare, so the real app screen can be keyed and corner-pinned. No logos on the phone.

**Prompt (copy this):**

```text
Studio product photograph, 16:9 wide, of a modern unbranded smartphone standing upright, rotated about 18 degrees to the left in a three-quarter view, standing in the right third of the frame and about 70% of its height. Thin black bezels, rounded corners, polished warm-silver aluminium frame, small centred punch-hole camera. The screen is a perfectly flat uniform chroma green (#00B140) with no reflections and no glare. Seamless warm off-white to soft peach studio sweep, large soft key light from the upper left, thin rim light on the metal edge, soft contact shadow and faint floor reflection. Left half of the frame clean. No brand logos anywhere. No text, no letters, no numbers, no logos, no watermark, no user interface, no phone unless described. Photorealistic, natural anatomy, correct number of legs and ears, no distortion.
```

## P05 · `assets/film/p05_studio_light.png`

- **Shots:** S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S16, S17, S18, S20
- **Type:** background plate (reused environment)
- **Aspect ratio:** 16:9 (generate 3840x2160, or the model's largest 16:9 size, then upscale)
- **Purpose:** One shared environment behind every phone / floating-UI shot, so all app scenes feel like one continuous space.
- **Camera & composition:** Straight-on, centred horizon at 62% height, no foreground objects.
- **Lighting & colour:** Soft overhead studio light, a gentle warm glow behind the centre, subtle radial falloff to the edges.
- **Subject:** Empty seamless studio cyclorama, no objects.
- **Background:** Warm off-white (#FFFAFA) centre, soft peach (#FFE3D6) to light coral (#FFC2B8) toward the edges, very soft floor line.
- **Space for type:** Entire plate is negative space.
- **Keep blank for compositing:** Completely empty: the phone, UI layers, ribbons and type are all added later.

**Prompt (copy this):**

```text
Empty seamless studio cyclorama background, 16:9 wide, photographic. Warm off-white centre with a soft peach and light coral gradient toward the edges, a very soft barely visible floor line at about 62% of the height, gentle radial glow behind the centre, soft overhead light, smooth and clean with fine film grain. No objects at all. No text, no letters, no numbers, no logos, no watermark, no user interface, no phone unless described. Photorealistic, natural anatomy, correct number of legs and ears, no distortion.
```

## P06 · `assets/film/p06_studio_dark.png`

- **Shots:** S14, S15
- **Type:** background plate
- **Aspect ratio:** 16:9 (generate 3840x2160, or the model's largest 16:9 size, then upscale)
- **Purpose:** Low-key space for the quiet breakdown (the like) and the match reveal.
- **Camera & composition:** Straight-on, no horizon visible.
- **Lighting & colour:** Very low key; one warm ember glow (#FF7A00 to #FF1744) behind centre, a few soft out-of-focus warm bokeh discs near the edges.
- **Subject:** Empty dark space.
- **Background:** Near-black warm charcoal (#120A0A) with the ember glow at 45% height.
- **Space for type:** All negative space; the centre glow is where the card and heart sit.
- **Keep blank for compositing:** No hearts, no symbols, no text.

**Prompt (copy this):**

```text
Dark cinematic abstract background, 16:9 wide. Near-black warm charcoal space with a soft ember-orange to coral glow behind the centre at about 45% of the height, and a few large soft out-of-focus warm bokeh discs near the edges. Very low-key, velvety, subtle film grain, no hard shapes. No text, no letters, no numbers, no logos, no watermark, no user interface, no phone unless described. Photorealistic, natural anatomy, correct number of legs and ears, no distortion.
```

## P07 · `assets/film/p07_shiro_avatar.png`

- **Shots:** S05, S07, S08, S14
- **Type:** pet photograph (in-app avatar)
- **Aspect ratio:** 1:1 (2048x2048)
- **Purpose:** Shiro's profile photo: dropped into 'Add Photo', becomes the avatar in Discover's pet switcher and the coin in S14. Must also be placed in the Figma screens so the app shows the same photo.
- **Camera & composition:** Head-and-shoulders portrait, face centred, eyes at 42% height, 85 mm, eye level.
- **Lighting & colour:** Soft daylight, warm, even, catchlights in both eyes.
- **Subject:** Shiro, a young adult cream Shiba Inu: pale cream-white coat with faint warm-biscuit shading on the ears and back, cream urajiro cheeks, small upright triangular ears, dark almond-shaped eyes, black nose and lips, tightly curled tail over the back, wearing a slim glossy red leather collar (#E8102E) with a small round brushed-gold tag, happy relaxed expression, mouth slightly open, looking at the camera, collar visible.
- **Background:** Plain soft warm-peach seamless background (#FFE3D6), evenly lit, so it can be cut out.
- **Space for type:** Face must fit inside a centred circle that is 80% of the frame width.
- **Keep blank for compositing:** Plain background only.

**Prompt (copy this):**

```text
Studio portrait photograph, square 1:1, of Shiro, a young adult cream Shiba Inu: pale cream-white coat with faint warm-biscuit shading on the ears and back, cream urajiro cheeks, small upright triangular ears, dark almond-shaped eyes, black nose and lips, tightly curled tail over the back, wearing a slim glossy red leather collar (#E8102E) with a small round brushed-gold tag. Head and shoulders, face centred, looking straight at the camera with a happy relaxed expression, mouth slightly open, red collar and gold tag visible. Plain evenly lit soft warm-peach seamless background. Soft warm daylight, catchlights in both eyes, 85 mm lens, f/4, crisp fur detail. The whole head fits within a centred circle. No text, no letters, no numbers, no logos, no watermark, no user interface, no phone unless described. Photorealistic, natural anatomy, correct number of legs and ears, no distortion.
```

## P08 · `assets/film/p08_tom_card.png`

- **Shots:** S09, S10, S14, S15
- **Type:** pet photograph (in-app Discover card)
- **Aspect ratio:** 3:4 (1536x2048)
- **Purpose:** Tom's photo for his Discover card, his profile page and the match screen background. Place it in Figma, then export the screens.
- **Camera & composition:** Three-quarter portrait, head at upper third, 70 mm, slightly below eye level.
- **Lighting & colour:** Soft afternoon light, warm, with gentle background separation.
- **Subject:** Tom, a young adult golden retriever: medium-gold wavy coat with lighter feathering on ears, chest and legs, friendly dark-brown eyes, black nose, wearing a forest-green flat fabric collar (no tag text), sitting on grass, head tilted slightly, tongue out, friendly.
- **Background:** Sunny park, soft green and gold bokeh.
- **Space for type:** Top-left 30% and bottom 25% should be calm (the card shows the name/breed chips top-left and buttons at the bottom).
- **Keep blank for compositing:** No other animals, no people.

**Prompt (copy this):**

```text
Photograph, 3:4 portrait, of Tom, a young adult golden retriever: medium-gold wavy coat with lighter feathering on ears, chest and legs, friendly dark-brown eyes, black nose, wearing a forest-green flat fabric collar (no tag text), sitting on grass in a sunny park, head tilted slightly, tongue out, friendly expression, body three-quarter to camera with the head in the upper third. Soft warm afternoon light, green and gold creamy bokeh background, 70 mm lens, f/2.8. Upper-left area and bottom quarter are calm and low-detail. No text, no letters, no numbers, no logos, no watermark, no user interface, no phone unless described. Photorealistic, natural anatomy, correct number of legs and ears, no distortion.
```

## P09 · `assets/film/p09_tom_post.png`

- **Shots:** S10, S11, S12
- **Type:** pet photograph (in-app Feed post)
- **Aspect ratio:** 2:3 (1600x2400)
- **Purpose:** Tom's Feed post photo (replaces the Shiba 'Ruby' photo so the hero dogs never look alike). Also the first tile of his profile gallery.
- **Camera & composition:** Low angle at dog height, 50 mm, Tom running toward camera, centred, slight motion in the ears.
- **Lighting & colour:** Bright late-morning sun, backlit yellow flowers, warm and joyful.
- **Subject:** Tom, a young adult golden retriever: medium-gold wavy coat with lighter feathering on ears, chest and legs, friendly dark-brown eyes, black nose, wearing a forest-green flat fabric collar (no tag text), running happily toward camera through a meadow of small yellow flowers, mouth open, ears bouncing.
- **Background:** Meadow of yellow wildflowers and green grass, soft bokeh.
- **Space for type:** Bottom 22% calm (author row and caption overlay); right edge strip calm (like/comment/share rail).
- **Keep blank for compositing:** No other animals, no people.

**Prompt (copy this):**

```text
Joyful photograph, 2:3 portrait, of Tom, a young adult golden retriever: medium-gold wavy coat with lighter feathering on ears, chest and legs, friendly dark-brown eyes, black nose, wearing a forest-green flat fabric collar (no tag text), running happily toward the camera through a meadow of small yellow wildflowers, mouth open, ears bouncing, low angle at dog height, 50 mm lens, f/2.8, fast shutter. Bright late-morning backlight through the flowers, warm and fresh. Bottom fifth and the right edge are softer and calmer. No text, no letters, no numbers, no logos, no watermark, no user interface, no phone unless described. Photorealistic, natural anatomy, correct number of legs and ears, no distortion.
```

## P10 · `assets/film/p10_friendship.png`

- **Shots:** S18, S19
- **Type:** pet photograph (background plate)
- **Aspect ratio:** 16:9 (generate 3840x2160, or the model's largest 16:9 size, then upscale)
- **Purpose:** The payoff: the two matched pets meeting in real life. Also seen blurred through the chat bubble window in S18.
- **Camera & composition:** 35 mm at dog eye level; both dogs in the RIGHT 60% of the frame, facing each other playfully.
- **Lighting & colour:** Golden hour, warm backlight, soft lens flare from upper right.
- **Subject:** Shiro, a young adult cream Shiba Inu: pale cream-white coat with faint warm-biscuit shading on the ears and back, cream urajiro cheeks, small upright triangular ears, dark almond-shaped eyes, black nose and lips, tightly curled tail over the back, wearing a slim glossy red leather collar (#E8102E) with a small round brushed-gold tag and Tom, a young adult golden retriever: medium-gold wavy coat with lighter feathering on ears, chest and legs, friendly dark-brown eyes, black nose, wearing a forest-green flat fabric collar (no tag text), playing together on short grass in a park: Shiro in a play-bow on the left, Tom bounding in from the right, both happy.
- **Background:** Park with trees and warm autumn-gold light, soft bokeh.
- **Space for type:** Left 35% is open soft park and sky (the headline goes there).
- **Keep blank for compositing:** No people, no leashes, no other animals.

**Prompt (copy this):**

```text
Heart-warming cinematic photograph, 16:9 wide frame. Shiro, a young adult cream Shiba Inu: pale cream-white coat with faint warm-biscuit shading on the ears and back, cream urajiro cheeks, small upright triangular ears, dark almond-shaped eyes, black nose and lips, tightly curled tail over the back, wearing a slim glossy red leather collar (#E8102E) with a small round brushed-gold tag in a playful play-bow and Tom, a young adult golden retriever: medium-gold wavy coat with lighter feathering on ears, chest and legs, friendly dark-brown eyes, black nose, wearing a forest-green flat fabric collar (no tag text) bounding in, the two dogs facing each other and playing on short grass in a park, both in the right 60% of the frame. Golden-hour backlight, a soft lens flare from the upper right, warm autumn-gold trees in creamy bokeh, 35 mm lens at dog eye level, f/2.8. The left third is open soft park and sky with little detail. No text, no letters, no numbers, no logos, no watermark, no user interface, no phone unless described. Photorealistic, natural anatomy, correct number of legs and ears, no distortion.
```

## P11 · `assets/film/p11_endcard_bg.png`

- **Shots:** S21
- **Type:** 3D render (background plate)
- **Aspect ratio:** 16:9 (generate 3840x2160, or the model's largest 16:9 size, then upscale)
- **Purpose:** Final brand frame background: calm and clean, so the woven logo made of the two loop-lines is the only thing to look at.
- **Camera & composition:** Straight-on.
- **Lighting & colour:** Soft even studio light with a faint warm glow behind the logo position.
- **Subject:** No subject.
- **Background:** Warm off-white (#FFFAFA) centre fading to soft peach (#FFE3D6) at the edges, very subtle vignette.
- **Space for type:** Entire plate is negative space.
- **Keep blank for compositing:** Completely empty.

**Prompt (copy this):**

```text
Empty seamless studio backdrop, 16:9 wide, photographic, ultra clean. Warm off-white centre softly fading to pale peach at the edges, a faint warm glow behind the upper-middle of the frame, very subtle vignette, fine film grain, no objects, no shapes. No text, no letters, no numbers, no logos, no watermark, no user interface, no phone unless described. Photorealistic, natural anatomy, correct number of legs and ears, no distortion.
```
