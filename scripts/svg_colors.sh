#!/bin/bash
# Count every hex color used in SVG artwork, overall and per file. Artwork colors beat PDF labels.
# Usage: svg_colors.sh <folder> [--per-file]
DIR="${1:?usage: svg_colors.sh <folder> [--per-file]}"
echo "## All SVGs under $DIR (count  hex)"
find "$DIR" -iname '*.svg' -not -path '*/node_modules/*' -not -path '*/dist/*' -print0 | xargs -0 grep -ohiE '#[0-9a-f]{6}\b' | tr 'a-f' 'A-F' | sort | uniq -c | sort -rn
if [ "${2:-}" = "--per-file" ]; then
  echo; echo "## Per file (top 8)"
  find "$DIR" -iname '*.svg' -not -path '*/node_modules/*' -not -path '*/dist/*' -print0 | while IFS= read -r -d '' f; do
    printf '%s\n   %s\n' "${f#$DIR/}" "$(grep -oiE '#[0-9a-f]{6}\b' "$f" | tr 'a-f' 'A-F' | sort | uniq -c | sort -rn | head -8 | awk '{printf "%s(%s) ",$2,$1}')"
  done
fi
