# Kestrel Tea Brand Website

> **Example only.** Kestrel Tea Co. and Northfold Studio are fictional. This is the reference implementation the skill copies and adapts; the brand library it reads (guidelines PDF, logos, fonts, artwork) is not included, so `npm run build` will not run as-is. Point `BRAND_LIBRARY` at a real library after adapting the brand-specific parts listed in `references/site-and-deploy.md`.

A static website for the Kestrel Tea brand guidelines and design system, built for people and AI agents. Every page is generated from two files in the brand library root:

- `../BRAND.md`: strategy, voice, approved identity, naming, claims, open items
- `../DESIGN.md`: design tokens, combinations, type scale, components

Don't edit pages in `dist/`. Edit the two Markdown files and rebuild.

## Build and preview

Requires Node 20+, plus `pdftoppm` (poppler), `cwebp` (webp) and `magick` (ImageMagick). On macOS: `brew install poppler webp imagemagick`.

```sh
npm install
npm run build      # writes dist/
npm run preview    # http://localhost:4173
```

The build:
1. Lints `DESIGN.md` with Google's `design.md` CLI, and stops on errors.
2. Stops if any color in the DESIGN.md prose disagrees with its token.
3. Renders the 50 original PDF pages, so every *(PDF p.N)* reference links to its source page.
4. Copies the logos, brand assets, mockups and packaging art.
5. Exports `tokens.json` (W3C Design Tokens 2025.10) and `tailwind-theme.css`.
6. Writes `llms.txt`, `robots.txt` and the agent-facing copies of `BRAND.md` and `DESIGN.md`.

Converted images are cached in `.cache/`. Delete that folder to force a full rebuild.

## Deploy

Example target: **https://kestrel-brand.netlify.app** (Netlify site `kestrel-brand`). Replace with your own.

The build needs the brand library and local image tools, so it runs on your machine and `dist/` is committed. Netlify only publishes `dist/` (see `netlify.toml`). To update the live site:

```sh
SITE_URL=https://kestrel-brand.netlify.app npm run build
git add -A && git commit -m "Update brand site"
git push
netlify deploy --prod --dir dist
```

Always build with `SITE_URL`, so `llms.txt`, the sitemap and the "Open in Claude / ChatGPT" prompts use absolute links. If this repo is cloned outside the brand library, set `BRAND_LIBRARY` to the library folder.

## Before publishing publicly

- **Font licenses.** The site embeds the brand fonts as web fonts. Web use often needs its own license. Here Fraunces, Instrument Sans and Bricolage Grotesque are SIL OFL fonts, but a real library usually includes commercial faces, and the packaging script face is unverified (BRAND.md Open Item 10). Until every license is confirmed, either keep the site private or build with fallback fonts: `EMBED_FONTS=false npm run build`.
- **Open Items.** BRAND.md lists its unresolved items. The Governance page shows them openly, which is intentional for internal use. Decide whether you want them visible on a public site.
- **Claims.** No product claim is marked approved yet. Check BRAND.md > Governance > Claims before pointing customers or partners at the site.
