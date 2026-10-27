---
name: brand-guidelines-site
description: Turn a designer's brand library (guidelines PDF, logos, fonts, packaging and collateral artwork) into agent-readable BRAND.md + DESIGN.md files and a static brand-guidelines website, then deploy it (Netlify + GitHub). Covers auditing the library against the PDF, writing both files with source citations and open items, generating the site, and verifying that AI agents can read it. Use this whenever someone wants their brand guidelines online, an "AI-ready" or "agent-friendly" brand, BRAND.md or DESIGN.md files, a design-system site built from a brand PDF, an audit of a brand folder for errors, or asks to publish or update a brand guidelines website, even if they only ask for one of these steps.
---

# Brand guidelines → agent-readable brand files → website

This skill captures the process used to turn a real designer-made brand library into a live, agent-readable guidelines site. The worked example in `examples/kestrel-tea/` is a fictional brand (Kestrel Tea Co., identity by the fictional Northfold Studio) with the same structure. The pipeline:

```
brand library ──► inventory ──► look at every page ──► audit ──► BRAND.md + DESIGN.md ──► static site ──► deploy ──► verify as an agent
                                                       (report)        (lint)                (local QA)    (ask)
```

The user may want only part of it (just the audit, just the two files, just a redeploy). Find where they are and start there. Each phase ends with something the user can check.

## Principles (the why behind every step)

1. **Fidelity to the designer.** The owner wants the result "very true to what the designer built". Rendered pages and production artwork are the truth; extracted text and swatch labels are not. In the library this skill was built on, two color labels in the PDF were wrong and a packaging file had the wrong product name. Only looking at the artwork found them.
2. **Cite everything.** Every value and statement carries *(PDF p.N)*, *(artwork)* or *(proposal)*. Agents behave better when told what is approved, what is observed and what is a guess. People can check any claim in one click.
3. **Flag, don't fix.** When the PDF and the artwork disagree, the artwork wins *for the value*, and the conflict goes into **Open Items** for the owner and designer. Never silently correct someone's brand, and never "fix" a brand color to satisfy a linter.
4. **Claims need a human.** Nothing is an approved claim until the owner approves it with evidence. List every claim found as a draft; list mockup placeholders as prohibited.
5. **Readable without JavaScript.** Agents fetch HTML and Markdown. The site must be static, with BRAND.md and DESIGN.md at stable URLs. JS-rendered brand sites show agents an empty page.
6. **One source.** The site is generated from BRAND.md + DESIGN.md. Never hand-edit the output.

## Phase 0: Intake

- Find the library folder, the guidelines PDF, the designer's name and the design date. Use the folder's own numbering when adding folders (e.g. `6 - Brand Website`).
- Check tools: `pdftoppm pdftotext pdfinfo` (poppler), `magick` (ImageMagick), `cwebp` (webp), `fc-scan` (fontconfig), `node`/`npx`, and for deploys `gh`, `netlify`. Install missing ones with brew only after telling the user.
- If the user points at reference sites, study what an agent actually receives: `curl` the page, `llms.txt`, `robots.txt`, any `.md`/`.json` exports, and fetch with WebFetch. Note what to copy (claims registers, "proposal" labels, vocabulary tables, tagline-by-context) and what fails (JS-only content, `Disallow: /`).
- Check memory for earlier work on this brand: verified values are expensive to re-derive.

## Phase 1: Inventory

```sh
~/.claude/skills/brand-guidelines-site/scripts/inventory.sh "<library>"
```
It reports the folder tree, file types, PDFs with page counts, fonts supplied, font families used by artwork (flagging any with no font file), and duplicated content grouped by folder. Read the whole output. The folder map goes into the Phase 3 report.

## Phase 2: Look at every page

```sh
~/.claude/skills/brand-guidelines-site/scripts/render_pdf.sh "<guidelines.pdf>" "<scratchpad>/pages" 110
```
Read every contact sheet, then single pages at full size wherever there is small print (type scale, swatch labels, construction notes, index). Keep renders in the scratchpad, not the library. Note the viewer-page vs printed-page offset.

## Phase 3: Audit, then report

Follow `references/audit.md`. In short: measure colors on the rendered swatches and in the SVGs (`scripts/svg_colors.sh`), proofread artwork copy against file names (`scripts/svg_text.sh`), check type, structure, placeholders and housekeeping.

**Checkpoint:** report to the user before writing files: urgent print errors first, then the folder map, the true specs with sources, and gaps for the designer. Save verified values and known errors to memory.

## Phase 4: BRAND.md + DESIGN.md

Follow `references/brand-files.md`, and read the worked examples `examples/kestrel-tea/BRAND.md` and `DESIGN.md` first. Write both to the library root. Then:

```sh
npx -y @google/design.md lint DESIGN.md      # must be 0 errors; contrast warnings on designer pairings become Open Items
```

**Checkpoint:** summarize how fidelity was kept, list the lint findings, and give the top open items. Ask the owner to confirm the *(proposal)* sections when convenient. Don't block on it.

## Phase 5: The website

Follow `references/site-and-deploy.md`. Copy `examples/kestrel-tea/site/` to `<library>/<N> - Brand Website/`, replace every brand-specific part listed there, build, and run local QA: every page at 1440px and 375px, no console errors, no horizontal scroll, the Open-in-Claude prompt, and text present without JS. Make it look like the designer's document, not a generic docs theme: their cover style, their fonts, their colors, their page pattern.

**Checkpoint:** give the user the local preview URL and the list of pages, and say what it would expose publicly (fonts, Open Items, draft claims).

## Phase 6: Deploy

Ask before anything outward-facing, in one AskUserQuestion: site name/URL, repo visibility (private recommended), and whether to embed brand fonts (licensing risk; `EMBED_FONTS=false` is the safe option). Never touch the user's other sites or repos. Commands and the commit-`dist/` model are in `references/site-and-deploy.md`.

Then verify live:
```sh
~/.claude/skills/brand-guidelines-site/scripts/check_live.sh https://<name>.netlify.app
```
Then WebFetch the home page and `/BRAND.md` to confirm an agent gets real content.

## Phase 7: Hand-off

Report: live URL, repo, what was verified, the update workflow (edit the Markdown → `SITE_URL=… npm run build` → commit + push → `netlify deploy --prod --dir dist`), and what is public. Update memory with URLs, the site ID and the deploy model. Offer (don't do) a message to the designer listing their fixes, and auto-deploy from the repo.

## Updating an existing brand site

Usually just: edit BRAND.md/DESIGN.md (keep citations and Open Items current; remove an item only when it's resolved), rebuild with `SITE_URL`, lint, check the changed pages, commit, deploy, and run `check_live.sh`. If the designer sends new artwork, re-run the relevant audit steps on the changed folders first.

## Files in this skill

- `references/audit.md`: how to audit a library (colors, type, copy, structure, placeholders).
- `references/brand-files.md`: BRAND.md and DESIGN.md structure, markers, claims, lint/export, and the prose formats the generator parses.
- `references/site-and-deploy.md`: site architecture, what to adapt, requirements, local QA, deploy commands, pitfalls.
- Specs: [BRAND.md](https://thebrand.md/) (0.3.0 when written) and Google's [DESIGN.md](https://github.com/google-labs-code/design.md) (`version: alpha`; `npx @google/design.md spec --rules` prints the live rules). Check for newer versions.
- `scripts/`: `inventory.sh`, `render_pdf.sh`, `svg_colors.sh`, `svg_text.sh`, `check_live.sh`.
- `examples/kestrel-tea/`: a fictional worked example: BRAND.md, DESIGN.md and the site source (build.mjs, styles, netlify.toml, README). The brand library it reads is not included.
