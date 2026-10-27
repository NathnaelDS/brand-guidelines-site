#!/bin/bash
# Verify a deployed brand site: every page and file returns 200, Markdown is served as text/markdown,
# and pages carry real text without JavaScript (what an AI agent's fetch sees).
# Usage: check_live.sh https://brand.example.com [extra paths...]
B="${1:?usage: check_live.sh <base-url> [paths...]}"; B="${B%/}"; shift
paths=("" BRAND.md DESIGN.md llms.txt robots.txt sitemap.xml tokens.json "$@")
# Add every internal page linked from the home page (Netlify "pretty URLs" rewrites a.html to '/a').
paths+=($(curl -s "$B/" | grep -oE "href=[\"'](/)?[a-z0-9-]+(\.html)?[\"']" | sed -E "s/href=[\"']\/?//; s/[\"']$//" | grep -vE '^(BRAND|DESIGN)' | sort -u))
fail=0
for p in "${paths[@]}"; do
  r=$(curl -s --retry 2 --retry-all-errors -o /dev/null -w '%{http_code} %{content_type}' "$B/$p")
  printf '%-28s %s\n' "/$p" "$r"
  case "$r" in 200*) ;; *) fail=1;; esac
  case "$p" in *.md) echo "$r" | grep -q 'text/markdown' || { echo "   ^ expected text/markdown"; fail=1; };; esac
done
words=$(curl -s "$B/" | perl -0pe 's/<script.*?<\/script>//gs; s/<style.*?<\/style>//gs; s/<[^>]+>/ /g' | wc -w | tr -d ' ')
echo "Home page words without JS: $words"; [ "$words" -lt 150 ] && { echo "   ^ too little static text: agents will see an empty page"; fail=1; }
exit $fail
