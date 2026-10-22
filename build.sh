#!/usr/bin/env bash
# Concatenates src/*.js (order matters: later files use earlier ones) into one self-contained page.
set -e
cd "$(dirname "$0")"
ORDER="world nature props characters input-audio-camera story-loop"
: > dist/all.js
for f in $ORDER; do cat src/$f.js >> dist/all.js; echo >> dist/all.js; done
node --check dist/all.js
{ cat src/shell.html; echo '<script>(()=>{'; cat dist/all.js; echo '})();</script>'; } > dist/lantern-vale.html
echo "built dist/lantern-vale.html ($(wc -c < dist/lantern-vale.html) bytes)"
