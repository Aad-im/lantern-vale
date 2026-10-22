# Lantern Vale
A small cozy 3D exploration game (Three.js).

- Edit `src/*.js`, then run `./build.sh` -> `dist/lantern-vale.html` (open directly in a browser).
- Source order is defined in `build.sh`; files share one scope, so later files use earlier ones.
- `tests/playthrough.mjs` plays the whole story headless (needs playwright-core and three@0.128 locally).
- Design rules and ideas: `DESIGN.md`.

Next planned: convert to Vite + TypeScript modules, swap generated characters for glTF models.
