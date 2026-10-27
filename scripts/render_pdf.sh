#!/bin/bash
# Render every page of a guidelines PDF to PNG plus contact sheets (12 pages each) for visual review.
# Usage: render_pdf.sh <guidelines.pdf> <out-dir> [dpi=110]
# Then Read the contact sheets first, and the single pages at full size for small print (type scales, swatch labels).
set -e
PDF="${1:?usage: render_pdf.sh <pdf> <out-dir> [dpi]}"; OUT="${2:?out-dir}"; DPI="${3:-110}"
mkdir -p "$OUT"
pdftoppm -r "$DPI" -png "$PDF" "$OUT/p"
n=$(ls "$OUT"/p-*.png | wc -l | tr -d ' ')
s=1
files=($(ls "$OUT"/p-*.png | sort))
for ((i=0; i<${#files[@]}; i+=12)); do
  magick montage "${files[@]:i:12}" -tile 3x4 -geometry 640x+6+6 -label '%f' -pointsize 14 -background '#777' "$OUT/sheet-$(printf %02d $s).png"
  s=$((s+1))
done
echo "Rendered $n pages at ${DPI}dpi to $OUT; contact sheets: $(ls "$OUT"/sheet-*.png | wc -l | tr -d ' ')"
pdftotext -layout "$PDF" "$OUT/text.txt" && echo "Text layer: $OUT/text.txt ($(wc -w < "$OUT/text.txt" | tr -d ' ') words) — use for quotes only; verify values visually."
