# The brand website and its deploy

## What the site is

A static site generated from `BRAND.md` + `DESIGN.md` (plus the library's artwork) by one Node script. Nobody edits the HTML: edit the two Markdown files and rebuild, so the site, the Markdown and the exported tokens can never disagree.

It must work for two audiences:
- **People** get the designer's guidelines as browsable pages that *look like the designer's document* (their cover style, their fonts and colors, their page pattern), with every *(PDF p.N)* reference linking to the original page.
- **AI agents** get the same content with no JavaScript, plus the Markdown sources at stable URLs. The reference sites that inspired this (lemat-brand, turumbabrand on Vercel) render everything with JS, so an agent fetching them sees an empty page, and their own "Open in Claude" buttons send agents nowhere. That's the failure to avoid.

## Starting point: the worked example

`examples/kestrel-tea/site/` is the complete implementation, anonymised from a deployed site (the brand is fictional and the library it reads is not included):

| File | Role |
|---|---|
| `build.mjs` | The generator (~720 lines). Sections: 1 lint DESIGN.md · 2 parse frontmatter + outline (H2 chapters, H3 sections) · 3 provenance chips + PDF page links + Do/Don't markers · 4 palette tiers, CMYK and type tables from DESIGN.md prose, WCAG contrast · 5 assets (PDF pages → WebP, logos, mark-only crop, brand assets, mockups, packaging, fonts, downloads ZIP, BRAND/DESIGN copies, token exports, CSS vars) · 6 layout template · 7 the 11 pages · 8 llms.txt, robots.txt, sitemap.xml, ai-prompt.txt |
| `src/styles.css` | Mirrors the designer's page pattern: colored cover with the brand's graphic element, meta strip, hairline, title-left/prose-right blocks, sticky sidebar from 1040px, `<details>` menu on mobile. Color custom properties are injected from DESIGN.md tokens. |
| `src/site.js` | Progressive enhancement only: copy HEX/prompt buttons, builds "Open in Claude/ChatGPT" URLs. Content never depends on it. |
| `package.json` | `build`, `preview` scripts; deps `@google/design.md` (pinned), `js-yaml`, `marked`. |
| `netlify.toml` | Publish `dist`, no build command; `*.md` served as `text/markdown; charset=utf-8` with CORS `*`; CORS on llms.txt and tokens.json. |
| `README.md` | Build, preview, deploy, and pre-publication cautions. |

Copy it into `<library>/<N> - Brand Website/` and adapt. The generic machinery (sections 1–4, 6, 8, CSS structure) usually carries over unchanged. **Everything brand-specific must be replaced, not left in:**

- Library paths and folder names (`PDF`, `LOGO_DIR`, `ASSET_DIR`, mockup/post/packaging lists, `FONTS`).
- The mark-only crop: `viewBox="185 150 248 251"` was measured for the original brand's horizontal lockup. Measure the new one (render the SVG, find the mark's bounding box, convert to viewBox units), or skip the crop if a standalone mark file exists.
- `PAGES` (chapter titles should match the designer's own chapter names), the cover titles, page ledes, and per-page content (logo tiles, specimen samples, `SAMPLES` copy, which PDF pages are linked).
- The tone sliders on the Voice page: only if the designer drew sliders. Measure marker positions from the rendered page (marker x relative to the track's start/end).
- `onColor()` and other references to the example's token names (`pine-ink`, `paper-white`, `oxblood`).
- Credits: designer name, design date, company line, ™/®.
- `AI_PROMPT`, prompt library and project-instructions text: rewrite for the brand's products and claims.
- Asset grounds (`assetGrounds`) and their token colors.

Grep the adapted script for the old brand's name, token names and folder names before building; none should remain.

## Requirements checklist

- Every page readable with JavaScript disabled; real `<h1>`/`<h2>` text, no text baked into images.
- `BRAND.md`, `DESIGN.md`, `tokens.json`, `tailwind-theme.css`, `llms.txt` at the site root. `<link rel="alternate" type="text/markdown">` to both Markdown files in every page head.
- "Open in Claude / ChatGPT" + copy-prompt, pointing the agent at the absolute `BRAND.md`/`DESIGN.md` URLs (build with `SITE_URL`).
- A "How to Use" page: for people, for agents (reading order: frontmatter → Strategy → Tonal Rules as instructions → Phrases/Vocabulary as examples → Claims before any fact → DESIGN.md for visuals), Claude/ChatGPT projects, coding agents (CLAUDE.md/AGENTS.md snippet), Figma/Tailwind tokens, a prompt library, and how to update.
- Provenance chips visible (pdf / artwork / proposal) and every PDF page reference linked to the rendered page; an "Original PDF" page with all pages.
- Color page: swatches with copyable HEX, RGB, CMYK (or "not supplied"), and every designer pairing with its computed contrast and verdict.
- Governance page shows Claims and all Open Items. That's right for an internal site; ask before making it public.
- Downloads: the original PDF and a logos ZIP (SVG + PNG; exclude `.ai`/`.eps` to keep it small).
- `robots.txt` allows crawling; `sitemap.xml` when `SITE_URL` is set.
- Images: WebP, cached in `.cache/`, with width/height attributes (lazy images without dimensions collapse in screenshots and cause layout shift).
- Works at 375px with a 16px gutter and no horizontal scroll; long cover titles need `min-width:0; overflow-wrap:anywhere` and a clamp() size with a low minimum.

## Verify locally (before any deploy)

1. `npm install && npm run build`, then `npm run preview` (http://localhost:4173).
2. With a browser tool (chrome-devtools or Claude in Chrome), open every page at 1440px and at 375px. Screenshot and actually look: compare against the designer's rendered pages. Check `list_console_messages` for errors and that no page scrolls horizontally (`document.documentElement.scrollWidth <= innerWidth`).
3. Click the Open in Claude link and read the prompt it generates.
4. `curl -s localhost:4173/ | sed 's/<[^>]*>//g' | wc -w`: the home page should have substantial text without JS.

Known pitfalls from the first build:
- An absolutely positioned cover graphic covered the content: give siblings `position:relative` (`.cover > :not(.cover-x)`).
- Deleting `dist/` while the preview server ran broke it: empty the folder instead of removing it (the example does).
- Grid children with long words overflow: `main{min-width:0}`.
- Chrome-devtools can't save screenshots outside its workspace; save into the project (e.g. `.cache/shots`) and delete afterwards.
- Never open pages with `window.open` in a loop: it spawns tabs. Navigate one page at a time.

## Deploy (Netlify + GitHub)

Ask the user first, in one question set (these are their decisions, not defaults):
1. **Site name / URL** (e.g. `<brand>-brand.netlify.app`) and host (Netlify assumed here; Vercel or Cloudflare Pages work the same way with `dist/`).
2. **Repo visibility** (private recommended: the site exposes Open Items and draft claims, but the repo can stay private either way).
3. **Embed brand fonts?** Embedding makes the font files publicly downloadable; most commercial licenses need a web license. Offer `EMBED_FONTS=false` (system fallbacks) as the safe option. Record the choice.

Then:
```sh
cd "<library>/<N> - Brand Website"
gh auth status && netlify status                       # both CLIs logged in?
netlify sites:list --json | python3 -c "import json,sys; print([s['name'] for s in json.load(sys.stdin)])"   # name free? don't touch existing sites
SITE_URL=https://<name>.netlify.app npm run build      # absolute URLs in llms.txt, sitemap, prompts
printf 'node_modules/\n.cache/\n.netlify/\n.DS_Store\n' > .gitignore   # dist/ IS committed
git init -q -b main && git add -A && git commit -m "<Brand> brand website"
gh repo create <owner>/<repo> --private --source . --remote origin --push
netlify sites:create --name <name> --account-slug <slug> --disable-linking
netlify deploy --prod --dir dist --site <site-id> --message "Initial deploy (<sha>)"
```

The build runs locally because it needs the brand library and image tools, so `dist/` is committed and Netlify only publishes it (`command = ""` in netlify.toml). A push does not redeploy; `netlify deploy --prod` does. Write that into the README.

Verify live with `scripts/check_live.sh https://<name>.netlify.app`: every page 200, `.md` files served as `text/markdown`, real text without JS. Then fetch the home page and `BRAND.md` with WebFetch, the way an agent would, and confirm the content comes back (tagline, colors, open items).

## Hand-off

Tell the user: live URL, repo URL, what was verified, the 4-line update workflow, and what is publicly visible (fonts if embedded, Open Items, draft claims). Offer, don't do: connecting the repo for auto-deploys, a message to the designer listing their fixes.
