#!/bin/bash
# Print the live text in every SVG so artwork copy can be proofread against its file name.
# Catches wrong variant labels (a "Yellow" file whose text names a different variant), typos, template leftovers.
# Text converted to outlines can't be read this way: render those files and look at them.
# Usage: svg_text.sh <folder>
DIR="${1:?usage: svg_text.sh <folder>}"
python3 -I - "$DIR" <<'PY'
import html, os, re, sys
base = sys.argv[1]
for root, dirs, files in sorted(os.walk(base)):
    dirs[:] = sorted(d for d in dirs if not d.startswith('.') and d not in ('node_modules', 'dist'))
    for f in sorted(files):
        if not f.lower().endswith('.svg'): continue
        src = open(os.path.join(root, f), encoding='utf-8', errors='replace').read()
        src = re.sub(r'<style.*?</style>', '', src, flags=re.S)
        runs = []
        for t in re.findall(r'<text\b.*?</text>', src, flags=re.S):
            s = html.unescape(re.sub(r'<[^>]+>', '', t))
            s = re.sub(r'[\s ]+', ' ', s).strip()
            if s: runs.append(s)
        rel = os.path.relpath(os.path.join(root, f), base)
        print(f"{rel}\n    {' | '.join(runs) if runs else '(no live text: outlined or image-only)'}")
PY
