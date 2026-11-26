#!/usr/bin/env bash
# Kör proven för lib/. Kompilerar med projektets egen TypeScript och kör med
# Node:s inbyggda testkörare – inga extra beroenden.
set -euo pipefail
cd "$(dirname "$0")/.."
UT=node_modules/.cache/vvs-prov
rm -rf "$UT"
npx tsc -p test/tsconfig.json
node --test "$UT"/test/*.test.js
