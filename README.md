# brand-guidelines-site

A [Claude Code](https://claude.com/claude-code) skill that turns a designer's brand library (guidelines PDF, logos, fonts, packaging and collateral artwork) into two agent-readable files, `BRAND.md` and `DESIGN.md`, and a static brand-guidelines website generated from them.

```
brand library ──► inventory ──► look at every page ──► audit ──► BRAND.md + DESIGN.md ──► static site ──► deploy ──► verify as an agent
```

It was built while making a real guidelines site, and it encodes what that taught:

- **Trust the artwork, not the labels.** Rendered pages and production files are the truth. Swatch labels and extracted text are often wrong.
- **Cite everything.** Every value is marked *(PDF p.N)*, *(artwork)* or *(proposal)*, so people and agents know what is approved and what is a guess.
- **Flag, don't fix.** Conflicts between the PDF and the artwork go into an Open Items list for the owner and designer.
- **Claims need a human.** Nothing is an approved claim until the owner approves it with evidence.
- **Readable without JavaScript.** The site is static, with the Markdown files at stable URLs and an `llms.txt`.

## Install

```sh
git clone https://github.com/NathnaelDS/brand-guidelines-site ~/.claude/skills/brand-guidelines-site
```

Then ask Claude Code for something like "turn this brand folder into BRAND.md and DESIGN.md" or "audit this brand library". The skill also works one phase at a time: just the audit, just the two files, or just a redeploy.

## What's inside

| Path | Contents |
|---|---|
| `SKILL.md` | The process, phase by phase, with checkpoints |
| `references/audit.md` | How to audit a library: colors, type, copy, structure, placeholders |
| `references/brand-files.md` | Structure of BRAND.md and DESIGN.md, citation markers, claims, linting |
| `references/site-and-deploy.md` | Site architecture, what to adapt, local QA, deploy commands, pitfalls |
| `scripts/` | `inventory.sh`, `render_pdf.sh`, `svg_colors.sh`, `svg_text.sh`, `check_live.sh` |
| `examples/kestrel-tea/` | A worked example: BRAND.md, DESIGN.md and the site generator |

**The example brand is fictional.** Kestrel Tea Co. and Northfold Studio do not exist. The example shows the structure, citation density and the formats `build.mjs` parses. The brand library it reads (PDF, logos, fonts, artwork) is not included, so the site does not build as-is; the skill copies it and adapts the brand-specific parts listed in `references/site-and-deploy.md`.

## Requirements

- `pdftoppm`, `pdftotext`, `pdfinfo` (poppler), `magick` (ImageMagick), `cwebp` (webp), `fc-scan` (fontconfig): `brew install poppler imagemagick webp fontconfig`
- Node 20+
- For deploys: `gh` and the Netlify CLI

## Specs

- [BRAND.md](https://thebrand.md/) (written against 0.3.0)
- Google's [DESIGN.md](https://github.com/google-labs-code/design.md) (`version: alpha`), linted with `npx @google/design.md lint DESIGN.md`

Both are young; check for newer versions before relying on details.

## License

[MIT](LICENSE)
