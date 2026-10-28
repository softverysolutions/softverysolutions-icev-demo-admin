#!/bin/bash
# Double-click in Finder to start the Softvery Demo Admin on this Mac (no internet needed).
cd "$(dirname "$0")" || exit 1

PORT="${PORT:-4317}"

find_node() {
  if command -v node >/dev/null 2>&1; then command -v node; return; fi
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node "$HOME"/.nvm/versions/node/*/bin/node; do
    [ -x "$candidate" ] && { echo "$candidate"; return; }
  done
}

NODE="$(find_node)"
if [ -z "$NODE" ]; then
  echo "Node.js was not found. Install Node 18+ (https://nodejs.org) once, then run this again."
  read -r -p "Press Enter to close."
  exit 1
fi

if [ ! -f dist/index.html ]; then
  echo "No build in ./dist. Run: npm ci --legacy-peer-deps && npm run build:demo"
  read -r -p "Press Enter to close."
  exit 1
fi

exec "$NODE" scripts/serve-demo.js --port "$PORT" --open
