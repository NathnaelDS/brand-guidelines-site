#!/bin/bash
# Map a brand library: folder tree, file types, PDFs, fonts, duplicates, and fonts used by artwork but missing.
# Usage: inventory.sh "/path/to/Brand Library"
set -u
LIB="${1:?usage: inventory.sh <brand-library-folder>}"
cd "$LIB" || exit 1

echo "## Folders (depth 3)"
find . -mindepth 1 -maxdepth 3 -type d -not -path '*/.*' -not -path '*/node_modules*' | sort | sed 's#^\./##'

echo; echo "## Files by type"
find . -type f -not -path '*/.*' -not -path '*/node_modules/*' -not -path '*/dist/*' \
  | sed -E 's/.*\.([^./]+)$/\1/' | tr 'A-Z' 'a-z' | sort | uniq -c | sort -rn

echo; echo "## PDFs"
find . -iname '*.pdf' -not -path '*/node_modules/*' -not -path '*/dist/*' -size +200k -print0 | while IFS= read -r -d '' f; do
  printf '%s  pages=%s  size=%s\n' "${f#./}" "$(pdfinfo "$f" 2>/dev/null | awk '/^Pages/{print $2}')" "$(pdfinfo "$f" 2>/dev/null | awk -F': *' '/^Page size/{print $2}')"
done

echo; echo "## Fonts supplied (family | style | weight)"
find . -type f \( -iname '*.ttf' -o -iname '*.otf' -o -iname '*.woff' -o -iname '*.woff2' \) -not -path '*/node_modules/*' -not -path '*/dist/*' -print0 \
  | xargs -0 -I{} fc-scan --format '%{family[0]} | %{style[0]} | %{weight}\n' {} 2>/dev/null | sort -u
find . -iname '*.zip' -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.*' | sed 's#^\./#zip: #'

echo; echo "## Font families referenced by SVG artwork (and whether a font file is supplied)"
norm() { perl -lpe 's/^\s+|\s+$//g; s/_.*$//; s/-(ultra|extra|semi|demi)?(bold|light|regular|medium|black|thin|italic)$//i; s/[\s-]//g; $_=lc' ; }
have=$(find . -type f \( -iname '*.ttf' -o -iname '*.otf' \) -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.*' -print0 \
  | xargs -0 -I{} fc-scan --format '%{family[0]}\n' {} 2>/dev/null | norm | sort -u)
find . -iname '*.svg' -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.*' -print0 \
  | xargs -0 grep -ohE "font-family(=\"|: ?'?)[^\";',]+" 2>/dev/null | sed -E "s/font-family(=\"|: ?'?)//" | norm | sort | uniq -c | sort -rn \
  | while read -r n fam; do
      if echo "$have" | grep -qx "$fam"; then echo "  $n  $fam"; else echo "  $n  $fam   <-- MISSING: no font file supplied"; fi
    done
echo; echo "## Duplicate content (grouped by folder pair; a full duplicated folder shows as one line)"
python3 - <<'PY'
import hashlib, os, collections
groups = collections.defaultdict(list)
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', 'dist')]
    for f in files:
        p = os.path.join(root, f)
        if f.startswith('.') or os.path.getsize(p) < 1024: continue
        groups[hashlib.md5(open(p, 'rb').read()).hexdigest()].append(p[2:])
pairs = collections.Counter()
for paths in groups.values():
    paths.sort()
    for other in paths[1:]:
        a, b = paths[0], other
        # Strip the common trailing path so a duplicated folder collapses to its two roots.
        pa, pb = a.split('/'), b.split('/')
        while len(pa) > 1 and len(pb) > 1 and pa[-1] == pb[-1]:
            pa.pop(); pb.pop()
        pairs[('/'.join(pa), '/'.join(pb))] += 1
for (a, b), n in pairs.most_common(30):
    print(f"  {n:4d} file(s): {a}  ==  {b}")
if not pairs: print("  none")
PY
