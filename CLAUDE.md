# Lantern Vale

A small, cozy 3D exploration game in Three.js. Read DESIGN.md first: it defines the tone, art rules, palette and story. Follow it. No combat, no fail states, no timers.

## How the project works
- Source is in `src/*.js`. There is no module system: `build.sh` concatenates the files, in the order listed in `build.sh`, into one script wrapped in an IIFE and inlines it into `src/shell.html`. The output is `dist/lantern-vale.html`.
- All files share one scope, so later files use globals declared in earlier ones. If you add a file, add it to `ORDER` in `build.sh` in the right place.
- Build: `bash build.sh` (it also runs `node --check`). Then open `dist/lantern-vale.html` in a browser.
- `dist/` is generated and git-ignored. Never edit it by hand.

## File order and roles
1. `world.js`: helpers, renderer, lights, path, terrain mesh, water, sky.
2. `nature.js`: trees, rocks, grass, flowers, clouds, motes, butterflies.
3. `props.js`: camp, lantern, stone lamps, lighthouse, cottage, bell, stepping stones, sparkles.
4. `characters.js`: traveler and fox built from lathe/sphere shapes.
5. `input-audio-camera.js`: input, WebAudio (everything is synthesized), player movement, camera.
6. `story-loop.js`: dawn keyframes, story state machine, interactables, fox AI, frame loop, test hooks.

## Hard constraints
- Three.js **r128** from cdnjs (`three.min.js`). No `CapsuleGeometry`, no `BufferGeometryUtils`; use the local `capsule()` and `merge()` helpers.
- Color management in r128 is manual: hex colors are not converted automatically. Use `C(hex)` (which calls `convertSRGBToLinear`) for materials, vertex colors, lights and fog. The sky shader writes display-space colors directly.
- The finished page must stay a single self-contained HTML file (it is published as a ~16 MB-max artifact). No other external scripts; fonts only from Google Fonts.
- Art: smooth, rounded shapes only. No flat-shaded boxes. Keep the palette in DESIGN.md.

## Testing
- `tests/playthrough.mjs` plays the whole story in headless Chromium using the hooks on `window.__vale` (`step(dt,n)`, `tp(x,z,yaw)`, `press()`, `IA`, `S`, ...). Set `window.__hold=true` to stop the real-time loop and step deterministically.
- It needs `playwright-core` and `three@0.128.0` installed locally, and a Chromium path. Update the paths at the top of the script for your machine.
- Software rendering is slow: `step` only renders its last frame, so use few screenshots.
- After any change: run `bash build.sh`, then the playthrough, and check for console errors.

## Working style
- Make small, reviewable changes. One idea per commit, with a clear message.
- Keep new interactions few and gentle (walk, look, E to interact).
- When changing the look or sound, say what changed and why it fits DESIGN.md.
- Do not add dependencies or a build tool without asking first. A Vite + TypeScript conversion is planned but not started.

## Preview and sharing
- Fast local loop: run `bash build.sh`, then open `dist/lantern-vale.html` in a browser (a static server such as `npx live-server dist` reloads it on each build).
- The shareable playtest link is a published claude.ai artifact, updated from a claude.ai chat, not from this repo. Claude Code cannot publish it. When a change is ready to share, say so, and the user will take the built `dist/lantern-vale.html` (or the repo) to that chat.
- Keep `dist/lantern-vale.html` a single self-contained file so it can be dropped into an artifact unchanged.
