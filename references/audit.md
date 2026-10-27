# Auditing a brand library

The goal is to know what the designer *actually* built, and to find every place where the guidelines document disagrees with the production files or with itself. Each finding becomes either a corrected value (with its source) or an Open Item for the owner/designer. Never silently fix the designer's work.

Why this matters: in the library this skill was built on, text extraction alone produced wrong colors. The PDF's swatch labels had a copy-pasted HEX (one swatch showed another's numbers) and a wrong RGB, a packaging file had the wrong product name, and the guide referenced pages that didn't exist. Anything built on the labels alone would have spread those errors into every downstream file.

## 1. Look at every page

Run `scripts/render_pdf.sh <pdf> <scratch>/pages 110`, then **Read every contact sheet**. Then read single pages at full size wherever there is small print: type-scale tables, swatch labels, logo construction notes, index pages. Re-render a single page at 200–300 dpi if text is still too small (`pdftoppm -r 250 -f N -l N -png ...`).

Use `text.txt` (pdftotext) only for quoting copy. Values (HEX, sizes, weights) must be confirmed visually.

Note how page numbers work: the *PDF viewer* page number often differs from the number printed on the page (in one library, printed numbers ran one higher). Cite viewer page numbers as *(PDF p.N)* and say so in the preamble of BRAND.md.

Record as you go: chapters, every rule, every value, every example of copy, every template leftover.

## 2. Colors: measure, don't trust labels

1. **Swatch truth.** Sample the swatch fill itself on a rendered page: `magick page.png -format '%[hex:p{X,Y}]' info:`. Pick coordinates by first cropping/viewing the page. Coordinates are easy to get wrong; sample a few rows across the swatch (`-crop Wx1+0+Y`) and confirm the value is uniform.
2. **Artwork truth.** `scripts/svg_colors.sh "<library>/<logos|packaging|collaterals>" --per-file`. The colors used across production SVGs, weighted by count, are what was printed. **Artwork wins over a PDF label.**
3. **Cross-check every label:** HEX ↔ RGB (compute it), HEX ↔ swatch, and look for duplicated label blocks (two swatches with identical numbers = copy-paste error). CMYK can't be verified from screen; carry it as stated and mark unverified ones.
4. List **colors that appear in artwork but not in the palette** (off-by-a-few variants like `#D98826` vs `#D98929`, extra creams). Don't adopt them; list them as an Open Item ("adopt or correct?").

## 3. Typography

- `scripts/inventory.sh` lists supplied fonts (family/style/weight) and font families referenced by SVG artwork, flagging ones with no font file (e.g. a second-script or handwritten face used on packaging but never supplied).
- Read the type hierarchy page at high resolution: family, weight, size *range*, case, and role for each level. DESIGN.md takes the lower bound of each range as the token size and keeps the full range in a prose table.
- Watch for **template leftovers** (another brand's typeface or name in body text: one typography page named a typeface from the designer's previous client).
- Font licenses are almost never in the library. Web embedding usually needs a separate license: record it as an Open Item and ask before publishing fonts on a public site.

## 4. Copy on artwork

`scripts/svg_text.sh <folder>` prints the live text of every SVG next to its file name. Check:

- **Variant label matches the file name** (each colorway/size/flavor). This is how a "Yellow" pack labelled with another variant's name was found.
- Spelling of product names and the brand name (doubled letters, a dropped plural in the brand name).
- Consistent net weights, sizes and file naming (".ai named 10 Grams inside the 25 g folder").
- ® vs ™ consistency between guidelines and mockups.
- Files with no live text (outlined) must be rendered and looked at instead.

## 5. Structure of the guidelines document

- Does the index match the actual pages? Are chapters missing from the index or listed but absent (e.g. "Clear space" and "Minimum sizes" listed, no pages)?
- Rules that reference variants that don't exist in the files (e.g. "black logo" but no black file).
- Typos in the document itself, quoted with page numbers.

## 6. Mockups and placeholders

Mockups contain fake names, phone numbers, prices, follower counts, partner names. List every one and mark them **prohibited** in BRAND.md Governance > Claims, so agents never reuse them as facts. Also note real third-party names (a hotel on a white-label pack) that need permission before public use.

## 7. Files and housekeeping

From `inventory.sh`: duplicated folders, unnamed exports ("Rectangle 4781.png"), stray files, missing formats (no SVG for X, no PNG for Y).

## 8. Report before writing

Present to the user, in this order:
1. Anything that must be fixed before a print run (wrong labels on packaging come first).
2. Folder map (what's where).
3. The true specs (colors with source, type scale, logo set, assets), with the discrepancies called out.
4. Gaps in the guidelines the designer should fill.

Then save the verified values and known errors to memory if a memory system is available. They are expensive to re-derive.
