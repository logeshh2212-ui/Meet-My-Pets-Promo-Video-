# 3. Timecoded storyboard

Generated from the same data as `storyboard.launch.json`, so the two always agree. Times are seconds; frames are at 60 fps.
Every shot starts on a **measured** downbeat. Transitions happen inside the outgoing shot's last 0.33 s (the bass gap), so they never add length.

## Visual language (v2, built from MeetMyPets itself)

- **Two Loops**: The story line of the film. Shiro's loop-line (coral #FF1744 -> #FF7A00) and Tom's loop-line (amber #FFC107 -> #FF7A00) are thin glossy 3D tubes with the same stroke weight as the logo. They draw themselves through the scenes and do the transitions instead of generic ribbons or whips. Shiro's is born in S01, Tom's in S09. They first cross at the Follow (S12), touch at the like (S14), interlock into the match symbol on the drop (S15), braid the features together (S20) and pull tight into the woven logo (S21). The logo is literally the two pets' paths.
- **Paw Tap**: Every tap is a soft paw-pad glyph (from the app's Paw.svg) that presses with a little squash and a thin ripple ring. It is coral for Shiro's owner. It replaces cursor hands and plain dots.
- **Tag Type**: Headlines arrive one to three words per beat in Bricolage Grotesque. The key word lands inside a rounded pill shaped like a pet's collar tag (the same radius as the app's info chips), hanging from a tiny ring. It swings and settles (damped pendulum, ~0.5 s). Other words spring in with a short blur.
- **Swipe Cuts**: Act changes use the app's own gestures: the whole frame becomes a card and is swiped by a paw. Swiping right flashes the app's heart stamp for 2 frames. A Feed change is swiped up like a scroll. Used only 3 times (S02->S03, S10->S11, S19->S20).
- **Ring To Loop**: The app's real completion capsule closes at 100% and stretches into Shiro's loop. Product UI becomes the brand motif.
- **Interactive Widgets**: Every feature is shown by using it: the widget lifts out of the phone as a 3D layer cut pixel-exact from the Figma export, flies to the camera, gets a paw-tap and responds exactly as in the app (typing, toggles, chips, likes, counters, flips). Each shot has its own camera idea (overhead, worm's-eye, over-the-shoulder, billboard dolly, orbit), never the same phone move twice.
- **Wide Layout**: 16:9 for YouTube. Copy sits in the free side of the frame; the side changes with each act.

## Shot list

| Shot | Start | End | Dur | Frames | Act | Template | App screen |
|---|---|---|---|---|---|---|---|
| S01 | 0.000 | 2.510 | 2.510 | 0–151 | 1 Hello | photo | — |
| S02 | 2.510 | 5.821 | 3.311 | 151–349 | 1 Hello | photo | — |
| S03 | 5.821 | 9.132 | 3.311 | 349–548 | 1 Hello | brand | — |
| S04 | 9.132 | 15.754 | 6.622 | 548–945 | 2 Sign in | widgets | splash, login |
| S05 | 15.754 | 19.065 | 3.311 | 945–1144 | 3 You | widgets | your_profile, location |
| S06 | 19.065 | 25.687 | 6.622 | 1144–1541 | 4 Your pet | widgets | create, traits |
| S07 | 25.687 | 32.309 | 6.622 | 1541–1939 | 5 Discover | widgets | discover, pet_profile |
| S08 | 32.309 | 38.931 | 6.622 | 1939–2336 | 6 Feed | widgets | feed |
| S09 | 38.931 | 42.242 | 3.311 | 2336–2535 | 6 Feed | widgets | feed, discover |
| S10 | 42.242 | 47.208 | 4.966 | 2535–2832 | 7 Match | widgets | discover |
| S11 | 47.208 | 52.175 | 4.967 | 2832–3130 | 7 Match | widgets | match |
| S12 | 52.175 | 55.486 | 3.311 | 3130–3329 | 8 Chat | widgets | match, chat |
| S13 | 55.486 | 58.797 | 3.311 | 3329–3528 | 8 Chat | widgets | chat |
| S14 | 58.797 | 62.108 | 3.311 | 3528–3726 | 8 Chat | widgets | chat |
| S15 | 62.108 | 65.419 | 3.311 | 3726–3925 | 9 Together | photo | — |
| S16 | 65.419 | 72.041 | 6.622 | 3925–4322 | 9 Together | widgets | create, discover, feed, match, chat, manage_profile |
| S17 | 72.041 | 76.138 | 4.097 | 4322–4568 | 9 Together | endcard | — |
| **Total** | 0.000 | 76.138 | **76.138** | **4568** | | | |

## S01 · 0.000–2.510 s (2.510 s) · 1 Hello

| | |
|---|---|
| **Purpose** | Hook: meet Shiro before the product. |
| **Composition** | Macro of Shiro's eye in the right third; title lower-left. |
| **App screen** | None |
| **Plate** | P01 → `assets/film/p01_eye_macro.png` |
| **On-screen text** | Every pet / has a story. (accent: story.) |
| **Interaction** | None. |
| **Camera** | Slow dolly-in on the eye with depth parallax; rack focus lashes -> iris. |
| **UI animation** | Tag type on the beats; 'story.' lands in the collar-tag pill. |
| **3D / VFX** | Catchlight flare on the 1.50 hit becomes the point where Shiro's coral loop-line is born. |
| **Transition in** | Fade up with the first sound (0.67). |
| **Transition out** | The coral line swoops out of the pupil across the frame (2.18-2.51). |
| **Audio sync** | 0.67 s — first sound<br>1.50 s — pickup hit -> catchlight<br>2.51 s — downbeat -> cut |
| **SFX** | None. |
| **Assets needed** | P01 at 16:9 |

## S02 · 2.510–5.821 s (3.311 s) · 1 Hello

| | |
|---|---|
| **Purpose** | Curiosity: the world outside is bigger than home. |
| **Composition** | Shiro in the left third on the doorstep; headline upper-right. |
| **App screen** | None |
| **Plate** | P02 → `assets/film/p02_doorstep.png` |
| **On-screen text** | Their world / is bigger / than home. (accent: bigger) |
| **Interaction** | None. |
| **Camera** | 2.5D lateral truck with parallax. |
| **UI animation** | Tag type on the beats. |
| **3D / VFX** | The coral loop-line runs down the street, leading Shiro's gaze. |
| **Transition in** | Cut behind the loop-line. |
| **Transition out** | Swipe cut: the frame is swiped right like a Discover card (heart stamp, 2 frames). |
| **Audio sync** | 2.51 s — downbeat<br>5.82 s — downbeat -> cut |
| **SFX** | None. |
| **Assets needed** | P02 at 16:9 |

## S03 · 5.821–9.132 s (3.311 s) · 1 Hello

| | |
|---|---|
| **Purpose** | Brand: name and promise. |
| **Composition** | Double-loop centred; 'MeetMyPets.' in Love Ya Like A Sister; tagline. |
| **App screen** | None |
| **Plate** | P03 → `assets/film/p03_brand_gradient.png` |
| **On-screen text** | MeetMyPets. · Their social life starts here. (accent: Pets.) |
| **Interaction** | None. |
| **Camera** | Locked, slow 6 deg orbit while the mark draws. |
| **UI animation** | Shiro's coral line draws one loop; the second loop is a faint ghost (waiting for Tom). Wordmark on beat 2, tagline on beat 3. |
| **3D / VFX** | Bloom only on the loop. |
| **Transition in** | Swipe cut. |
| **Transition out** | The coral loop shrinks into depth and becomes the glow that wakes the phone screen. |
| **Audio sync** | 5.82 s — downbeat -> loop draws<br>6.65 s — wordmark<br>7.48 s — tagline<br>9.13 s — downbeat -> cut |
| **SFX** | None. |
| **Assets needed** | mmp_mark.svg |

## S04 · 9.132–15.754 s (6.622 s) · 2 Sign in

| | |
|---|---|
| **Purpose** | The story starts like every user's: open the app and sign in. |
| **Composition** | Phone right of centre, tilted 3/4; the Login screen comes apart into floating layers; each widget flies to the camera when it is used. Kicker + title top-left. |
| **App screen** | assets/figma/iPhone 14 & 15 Pro - 2@4x.png — FIGMA 4x: splash (dog-and-cat icon + serif wordmark on orange->red)<br>assets/figma/Login Page.png — FIGMA 4x: Login (Welcome, Email, Password, Login, Apple/Google) |
| **Plate** | P05 → `assets/film/p05_studio_light.png` |
| **On-screen text** | [Sign in] · Settle in. (accent: in.) |
| **Interaction** | Splash -> Login. The Login screen separates into layers. Email field: paw-tap, orange focus ring, the address types itself. Password field: paw-tap, dots type in. Login button: paw-tap, it presses, shrinks into a loading circle, and the circle bursts into the red of the next screen. |
| **Camera** | Starts with the splash filling the frame; pulls back and arcs 40 deg around the phone while the layers separate; then pushes to each widget as it comes forward. |
| **UI animation** | 9.132 splash wipes to Login. 9.96 layers lift (staggered). 10.79 email forward + paw-tap + typing. 12.86 password forward + paw-tap + dots. 14.10 Login forward + paw-tap + press -> loading circle -> red burst. |
| **3D / VFX** | Soft contact shadows under every lifted layer; the screen behind dims slightly; a focus glow on the active field. |
| **Transition in** | The glow from S03 wakes the screen. |
| **Transition out** | The Login button's loading circle bursts into a red disc that fills the frame: the red header of Complete Your Profile. |
| **Audio sync** | 9.13 s — downbeat -> splash<br>9.96 s — layers lift<br>10.79 s — email tap<br>12.86 s — password tap<br>14.10 s — Login tap<br>15.75 s — downbeat -> cut |
| **SFX** | Soft key ticks, one tap per paw (-20 dB). |
| **Assets needed** | Login Page.png (Figma 4x)<br>iPhone 14 & 15 Pro - 2@4x.png (splash) |

## S05 · 15.754–19.065 s (3.311 s) · 3 You

| | |
|---|---|
| **Purpose** | Tell the app who you are and where you are: the base of nearby discovery. |
| **Composition** | The red 'Complete Your Profile' header fills the frame, then the camera drops low and looks up at the location card standing like a sign. |
| **App screen** | assets/figma/Create Your Profile Page 01.png — FIGMA 4x: Complete Your Profile (owner)<br>assets/figma/Create Your Profile Page 02.png — FIGMA 1x: Location card (Use My Current Location / Search Manually), Complete My Profile |
| **Plate** | P05 → `assets/film/p05_studio_light.png` |
| **On-screen text** | [Your profile] · Near you. (accent: you.) |
| **Interaction** | Name field fills; the 'Choose Your Location' card stands up out of the phone; paw-tap 'Use My Current Location' -> a pin drops onto the card with a ripple; 'Complete My Profile' presses. |
| **Camera** | Low-angle tilt-up (worm's-eye) on the location card, then a quick push. |
| **UI animation** | 15.754 header. 16.17 name types. 17.00 location card stands up. 17.82 paw-tap -> pin drop + ripple. |
| **3D / VFX** | Pin drop with a soft bounce shadow. |
| **Transition in** | Red burst. |
| **Transition out** | 'Complete My Profile' presses and the screen slides up to Create Pet Profile (orange). |
| **Audio sync** | 15.75 s — downbeat<br>17.82 s — location tap<br>19.07 s — downbeat -> cut |
| **SFX** | One soft tap. |
| **Assets needed** | Create Your Profile Page 01/02 |

## S06 · 19.065–25.687 s (6.622 s) · 4 Your pet

| | |
|---|---|
| **Purpose** | Give your pet a profile: photo, name, paw-type, looks, personality. |
| **Composition** | Top-down 'desk' angle: the Create Pet Profile form lies flat like a card on a table, its parts lifting one at a time. Then a side angle on the Traits chips. |
| **App screen** | assets/figma/Create Pet Profile Page 01 (1).png — FIGMA 4x: current version ('Build Your Pet's Spotlight!', matches app code). Scroll parts: 'Create Pet Profile Page 02.png' (1x), 'Create Pet Profile Page 03.png' (4x)<br>assets/figma/Manage Pet Profile (1).png — FIGMA 1x (393x852; re-export at 4x if possible): 'Select Traits' chips + Save Traits |
| **Plate** | P05 → `assets/film/p05_studio_light.png` |
| **On-screen text** | [Create] · Their own / little spotlight. (accent: spotlight.) |
| **Interaction** | Photo circle: paw-tap -> Shiro's photo drops in. Name: types 'Shiro'. Paw-Type: paw-tap 'Male'. Traits: paw-taps 'Playful' and 'Friendly', each chip pops orange. The completion capsule climbs 30% -> 100%. 'Create Their Profile' presses; the ring closes and stretches into Shiro's coral loop around the photo = the coin. |
| **Camera** | Overhead (top-down) slow rotate, then tilt to a 3/4 side view for the chips, then follow the coin up. |
| **UI animation** | Two bars of taps on the beats (photo, name, paw-type, chip, chip, create). |
| **3D / VFX** | The capsule's ring glints when it closes. |
| **Transition in** | Slide up. |
| **Transition out** | The coin (Shiro's photo in the coral loop) flies up and drops into Discover's pet switcher. |
| **Audio sync** | 19.07 s — downbeat -> photo<br>22.38 s — downbeat -> traits<br>24.86 s — create tap<br>25.69 s — downbeat -> cut |
| **SFX** | Taps. |
| **Assets needed** | Create Pet Profile Page 01 (1).png<br>Manage Pet Profile (1).png (Traits)<br>P07 Shiro photo |

## S07 · 25.687–32.309 s (6.622 s) · 5 Discover

| | |
|---|---|
| **Purpose** | Discover pets near you: swipe, pass, and open a profile. |
| **Composition** | The Discover card stack leaves the phone and fans out in 3D like a hand of cards in front of camera; the phone stays behind, out of focus. |
| **App screen** | assets/figma/Discover page.png — FIGMA 4x: Discover card stack (sample data 'Lily - Husky' is replaced in the rebuild)<br>assets/figma/Pet Info page.png — FIGMA 2x: another pet's profile (Follow, distance, stats, Pet Details, Gallery); gallery scroll in 'Pet Info page (1).png' |
| **Plate** | P05 → `assets/film/p05_studio_light.png` |
| **On-screen text** | [Discover] · Discover / their world. (accent: world.) |
| **Interaction** | Paw swipes card 1 right (heart stamp); paw-taps X on card 2; Tom's card comes to the front; paw-tap (i): the card flips over and its back is Tom's profile page; paw-tap Follow -> Following. |
| **Camera** | Starts behind the fan (over-the-shoulder), swings around to face it, then a close-up on the flip. |
| **UI animation** | Card flights on beats 1-4 of bar 1; flip on bar 2 beat 1; Follow on beat 3. |
| **3D / VFX** | Card slabs with thickness and shadows; motion blur on flights. |
| **Transition in** | Coin lands in the pet switcher. |
| **Transition out** | Tom's gallery photo slides up out of his profile into the Feed (swipe-up cut). |
| **Audio sync** | 25.69 s — downbeat -> swipe<br>29.00 s — downbeat -> flip<br>32.31 s — downbeat -> cut |
| **SFX** | Swipe air, taps. |
| **Assets needed** | Discover page.png<br>Pet Info page.png<br>P08 Tom photo |

## S08 · 32.309–38.931 s (6.622 s) · 6 Feed

| | |
|---|---|
| **Purpose** | Share and react: like a post, follow a pet. |
| **Composition** | Tom's post stands huge like a billboard in the studio; the like/comment/share rail floats beside it as separate 3D buttons. |
| **App screen** | assets/figma/Feed page.png — FIGMA 4x: Feed (Liked pill, Follow, rail); 'Following' + 'Matched' tag states in 'Discover page (1).png' (2x, misnamed) |
| **Plate** | P05 → `assets/film/p05_studio_light.png` |
| **On-screen text** | [Feed] · Stop everything. / Look at this pet. (accent: this pet.) |
| **Interaction** | Paw double-taps the photo -> a heart blooms and the counter rolls 111 -> 112; paw-tap Follow -> orange Following; comment and share buttons bounce in turn. |
| **Camera** | Low dolly along the post like walking past a billboard; a quick rack-focus to the rail. |
| **UI animation** | Like on bar 1 beat 1, counter roll; Follow on beat 3; rail bounces on bar 2. |
| **3D / VFX** | Heart bloom (no confetti). |
| **Transition in** | Swipe up. |
| **Transition out** | Feed flicks up fast; the coral line streaks across as the bass drops. |
| **Audio sync** | 32.31 s — downbeat -> like<br>33.96 s — follow<br>38.93 s — downbeat -> cut |
| **SFX** | Like pop. |
| **Assets needed** | Feed page.png<br>Discover page (1).png (Following / Matched states)<br>P09 Tom post |

## S09 · 38.931–42.242 s (3.311 s) · 6 Feed

| | |
|---|---|
| **Purpose** | Bridge: back to Discover as the music empties. |
| **Composition** | Wide: the phone small in a big warm space; the bottom nav bar lifts off and floats toward the camera. |
| **App screen** | assets/figma/Feed page.png — FIGMA 4x: Feed (Liked pill, Follow, rail); 'Following' + 'Matched' tag states in 'Discover page (1).png' (2x, misnamed)<br>assets/figma/Discover page.png — FIGMA 4x: Discover card stack (sample data 'Lily - Husky' is replaced in the rebuild) |
| **Plate** | P05 → `assets/film/p05_studio_light.png` |
| **On-screen text** | None  |
| **Interaction** | Paw-tap the double-loop Discover tab on the floating nav bar; it glows. |
| **Camera** | Speed-ramped pull-back, then a slow push into the glowing tab. |
| **UI animation** | Bass drops ~40.6 -> slow motion; tab tap on beat 4. |
| **3D / VFX** | Exposure dips toward the breakdown. |
| **Transition in** | Streak. |
| **Transition out** | The camera passes through the double-loop tab into the dark. |
| **Audio sync** | 38.93 s — downbeat<br>40.60 s — bass out -> slow motion<br>42.24 s — breakdown |
| **SFX** | One tap. |
| **Assets needed** | Nav bar from the Feed export |

## S10 · 42.242–47.208 s (4.966 s) · 7 Match

| | |
|---|---|
| **Purpose** | Tension: Shiro and Tom drift together; the like. |
| **Composition** | Dark ember space: Shiro's coin and Tom's card float toward each other; the heart button hangs below. |
| **App screen** | assets/figma/Discover page.png — FIGMA 4x: Discover card stack (sample data 'Lily - Husky' is replaced in the rebuild) |
| **Plate** | P06 → `assets/film/p06_studio_dark.png` |
| **On-screen text** | When the likes / go both ways... (accent: both ways...) |
| **Interaction** | Paw-tap the heart on Tom's card. |
| **Camera** | Very slow push, shallow focus. |
| **UI animation** | The two loops pulse on each soft hit and drift closer; the like at 46.38. |
| **3D / VFX** | Warm bokeh; low-key grade. |
| **Transition in** | Through the tab. |
| **Transition out** | The loops touch as the drop hits. |
| **Audio sync** | 42.24 s — breakdown<br>46.38 s — like tap<br>47.21 s — DROP |
| **SFX** | One soft tap. |
| **Assets needed** |  |

## S11 · 47.208–52.175 s (4.967 s) · 7 Match

| | |
|---|---|
| **Purpose** | The payoff: a mutual match exactly on the drop. |
| **Composition** | The two loops interlock into the double-loop and slam into the real match screen; 'Chat Now' and 'Continue Discovering' slide up as 3D buttons. |
| **App screen** | assets/figma_rebuilt/match@4x.png — REBUILT 4x (source: assets/figma_rebuilt/match.html): the real Figma Discover underneath, dimmed + blurred; the official double-loop; the app's exact strings; app-style pill buttons |
| **Plate** | P06 → `assets/film/p06_studio_dark.png` |
| **On-screen text** | [Match] · The vibe / is mutual. (accent: mutual.) |
| **Interaction** | Match overlay appears (real strings). |
| **Camera** | Fast dolly-out from inside the symbol + 20 deg orbit. |
| **UI animation** | Loops interlock on the drop; title 'It's a Match!' and 'Tom liked you back.' on the next beats. |
| **3D / VFX** | One light bloom on the interlock; restrained shockwave. |
| **Transition in** | The loops meet. |
| **Transition out** | The paw moves to Chat Now. |
| **Audio sync** | 47.21 s — DROP -> interlock + chime<br>48.86 s — buttons<br>52.17 s — downbeat -> cut |
| **SFX** | One match chime. |
| **Assets needed** | figma_rebuilt/match@4x.png |

## S12 · 52.175–55.486 s (3.311 s) · 8 Chat

| | |
|---|---|
| **Purpose** | From match to conversation. |
| **Composition** | The Chat Now button flies to the camera; pressed, it stretches into the chat screen. |
| **App screen** | assets/figma_rebuilt/match@4x.png — REBUILT 4x (source: assets/figma_rebuilt/match.html): the real Figma Discover underneath, dimmed + blurred; the official double-loop; the app's exact strings; app-style pill buttons<br>assets/figma/Messaging page (1).png — FIGMA 4x: conversation (bubbles, Edit/Unsend menu, patterned background); clean state in 'Messaging page.png' (1x) |
| **Plate** | P05 → `assets/film/p05_studio_light.png` |
| **On-screen text** | [Chat] · Say hello. (accent: hello.) |
| **Interaction** | Paw-tap 'Chat Now' -> it expands into the conversation with Tom ('Online'). |
| **Camera** | Push, then the phone turns to 3/4. |
| **UI animation** | Press on the downbeat; expand over beat 1-2. |
| **3D / VFX** | Soft glow trail. |
| **Transition in** | Cut on the tap. |
| **Transition out** | Continuous. |
| **Audio sync** | 52.17 s — downbeat -> tap<br>55.49 s — downbeat |
| **SFX** | Tap. |
| **Assets needed** | Messaging page (1).png |

## S13 · 55.486–58.797 s (3.311 s) · 8 Chat

| | |
|---|---|
| **Purpose** | A real conversation: typing, sending, a reply. |
| **Composition** | Side angle along the message thread: the bubbles float off the screen in a line like stepping stones. |
| **App screen** | assets/figma/Messaging page (1).png — FIGMA 4x: conversation (bubbles, Edit/Unsend menu, patterned background); clean state in 'Messaging page.png' (1x) |
| **Plate** | P05 → `assets/film/p05_studio_light.png` |
| **On-screen text** | None  |
| **Interaction** | The message types into the input; paw-tap send -> the bubble flies into the thread; typing dots; the reply pops in. |
| **Camera** | Lateral track along the bubbles. |
| **UI animation** | Type beat 1, send beat 2, dots beat 3, reply beat 4. |
| **3D / VFX** | Bubbles as soft 3D pills with shadows. |
| **Transition in** | Continuous. |
| **Transition out** | Continuous. |
| **Audio sync** | 55.49 s — type<br>56.31 s — send<br>57.97 s — reply |
| **SFX** | Send tick. |
| **Assets needed** |  |

## S14 · 58.797–62.108 s (3.311 s) · 8 Chat

| | |
|---|---|
| **Purpose** | From the app to real life. |
| **Composition** | The last reply bubble lifts toward camera and becomes a window onto the park. |
| **App screen** | assets/figma/Messaging page (1).png — FIGMA 4x: conversation (bubbles, Edit/Unsend menu, patterned background); clean state in 'Messaging page.png' (1x) |
| **Plate** | P05 → `assets/film/p05_studio_light.png` |
| **On-screen text** | From a first hello...  |
| **Interaction** | None. |
| **Camera** | Push through the bubble. |
| **UI animation** | Bubble lifts, grows, becomes a window. |
| **3D / VFX** | Glass refraction. |
| **Transition in** | Continuous. |
| **Transition out** | Through the window. |
| **Audio sync** | 58.80 s — downbeat<br>62.11 s — downbeat -> cut |
| **SFX** | None. |
| **Assets needed** | P10 |

## S15 · 62.108–65.419 s (3.311 s) · 9 Together

| | |
|---|---|
| **Purpose** | The match becomes a real friendship. |
| **Composition** | Shiro and Tom playing in the right 60%; headline left. |
| **App screen** | None |
| **Plate** | P10 → `assets/film/p10_friendship.png` |
| **On-screen text** | ...to a real-life / friendship. (accent: real-life friendship.) |
| **Interaction** | None. |
| **Camera** | 2.5D push with parallax. |
| **UI animation** | Tag type. |
| **3D / VFX** | The two loop-lines circle the dogs once like a leash of light. |
| **Transition in** | Through the window. |
| **Transition out** | Swipe cut. |
| **Audio sync** | 62.11 s — downbeat<br>65.42 s — downbeat -> cut |
| **SFX** | None. |
| **Assets needed** | P10 at 16:9 |

## S16 · 65.419–72.041 s (6.622 s) · 9 Together

| | |
|---|---|
| **Purpose** | Everything you just did, in one place. |
| **Composition** | Every widget used in the film (Login button, location card, traits chips, Discover card, the post, the match symbol, chat bubbles) orbits the phone like a solar system; the two loop-lines braid through them. |
| **App screen** | assets/figma/Create Pet Profile Page 01 (1).png — FIGMA 4x: current version ('Build Your Pet's Spotlight!', matches app code). Scroll parts: 'Create Pet Profile Page 02.png' (1x), 'Create Pet Profile Page 03.png' (4x)<br>assets/figma/Discover page.png — FIGMA 4x: Discover card stack (sample data 'Lily - Husky' is replaced in the rebuild)<br>assets/figma/Feed page.png — FIGMA 4x: Feed (Liked pill, Follow, rail); 'Following' + 'Matched' tag states in 'Discover page (1).png' (2x, misnamed)<br>assets/figma_rebuilt/match@4x.png — REBUILT 4x (source: assets/figma_rebuilt/match.html): the real Figma Discover underneath, dimmed + blurred; the official double-loop; the app's exact strings; app-style pill buttons<br>assets/figma/Messaging page (1).png — FIGMA 4x: conversation (bubbles, Edit/Unsend menu, patterned background); clean state in 'Messaging page.png' (1x)<br>assets/figma/Manage Pet Profile.png — FIGMA 1x: your own pet's profile (Likes / Followers / Following / Matches counters) |
| **Plate** | P05 → `assets/film/p05_studio_light.png` |
| **On-screen text** | Discover. / Connect. / Belong. (accent: Belong.) |
| **Interaction** | Each widget gives one last tiny reaction as it passes the camera (a chip lights, a heart fills). |
| **Camera** | Slow crane up and around (overhead orbit), then a fast push into the phone. |
| **UI animation** | Widgets join on the beats; collapse into the phone on the last beat. |
| **3D / VFX** | Glossy loop-lines with shadows. |
| **Transition in** | Swipe cut. |
| **Transition out** | The two lines leave the phone for the logo. |
| **Audio sync** | 65.42 s — downbeat<br>68.73 s — downbeat<br>72.04 s — final hit |
| **SFX** | None. |
| **Assets needed** |  |

## S17 · 72.041–76.138 s (4.097 s) · 9 Together

| | |
|---|---|
| **Purpose** | A clear, memorable brand frame. |
| **Composition** | Woven logo centred, wordmark, tagline, 'Coming soon'. |
| **App screen** | None |
| **Plate** | P11 → `assets/film/p11_endcard_bg.png` |
| **On-screen text** | MeetMyPets. · Their social life starts here. (accent: Pets.) |
| **Interaction** | None. |
| **Camera** | Locked. |
| **UI animation** | The two lines pull tight into the woven logo on the final hit; wordmark, tagline, pill on the next beats; hold to the end. |
| **3D / VFX** | Soft bloom on the mark only. |
| **Transition in** | The lines arrive. |
| **Transition out** | None: the last frame is the brand frame. |
| **Audio sync** | 72.04 s — final hit<br>74.84 s — music gone<br>76.14 s — end |
| **SFX** | None. |
| **Assets needed** | mmp_mark_film.svg |
