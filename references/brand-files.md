# Writing BRAND.md and DESIGN.md

Two plain-text files at the root of the brand library, each with one job:

| File | Job | Spec |
|---|---|---|
| `BRAND.md` | Meaning: strategy, voice, approved identity (named colors, typefaces, logo rules), naming, claims, open items. "If it should survive a complete visual redesign, it belongs in BRAND.md." | BRAND.md 0.3.0 ([thebrand.md](https://thebrand.md/)) |
| `DESIGN.md` | Concrete visual values: color tokens, type scale, shapes, components (approved color pairings), do's and don'ts. | Google DESIGN.md, `version: alpha` ([repo](https://github.com/google-labs-code/design.md)); live rules: `npx @google/design.md spec --rules` |

Both specs are young and change. Before writing, check whether a newer version exists (`npx -y @google/design.md@latest --version`, the brand.md repo), and read the spec sections you need rather than relying on memory.

The worked example is `examples/kestrel-tea/BRAND.md` and `examples/kestrel-tea/DESIGN.md` (a fictional brand). Read them before writing; they show the tone, the density of citations, and the formats the site generator parses.

## Provenance markers (both files)

Every value and every statement carries its source, as an italic parenthetical:

- *(PDF p.N)*: stated in the guidelines (viewer page number).
- *(artwork)*: observed in production files, not stated in the PDF.
- *(proposal)*: not in any source. Written because the spec requires the section. Must be confirmed by the owner before it's policy.

Explain the markers in the preamble, and tell agents never to treat a *(proposal)* as approved. The site generator turns these into colored chips and links every "PDF p.N" to the rendered original page, so keep the exact form `*(PDF p.6)*`, `*(PDF p.12, p.20)*`, `*(artwork)*`, `*(proposal)*`.

Prefer the designer's own words: taglines, phrases, pillars and copy examples should be quoted from the PDF and artwork wherever they exist. Write new prose only where the spec demands a section the designer didn't cover, and mark it *(proposal)*.

## BRAND.md

Frontmatter:
```yaml
---
name: "Brand Name"
tagline: "The designer's repeated line"
version: 1
language: en          # spec allows only en or pt-BR
specVersion: "0.3.0"
---
```

Body (H1 brand name, preamble, then four H2 layers + Open Items). Section names the site generator expects:

- **Preamble**: one-paragraph description; what this file is; **Source of truth** (designer, date, the PDF path, the artwork folders, "artwork wins over PDF labels; conflicts listed under Open Items"); **Reading the markers**; one line telling agents to check Claims before stating facts.
- `## Strategy`: `### Overview`, `### Audience`, `### Positioning`, `### Personality`, `### References & Anti-References` (with `#### References`, `#### Anti-References`), `### Promise` (include a `**Base message**` paragraph: the home page lede is taken from it), `### Guardrails` (include a one-sentence litmus test).
- `## Voice`: `### Identity`, `### Tagline & Slogans` (tagline by context), `### Message Pillars`, `### Phrases`, `### Vocabulary` (a table: term | use | avoid | source: agents follow paired examples better than adjectives), `### Social Bios`, `### Tonal Rules` (imperative rules agents treat as standing instructions; include "We say / We never say" pairs).
- `## Visual`: `### Logo & Marks`, `### Core Colors` (named colors with HEX and role; ramps/scales go in DESIGN.md), `### Typefaces` (families, roles, licensing status, fallbacks only if specified), `### Photography & Illustration`, `### Art Direction`.
- `## Governance`: `### Naming` (product names exactly as on packaging, in every language used), `### Claims`.
- `## Open Items`: numbered, grouped under bold category labels, each with location and evidence. State the audit date and that agents must not resolve these silently.

### Claims

The spec allows only claims a human approved or that cite evidence. Since you can't approve anything, start with: "No claim has yet been recorded as approved with evidence," then a table of every claim found in artwork/PDF (claim | where | what evidence is needed), and a **Prohibited** list (mockup placeholders, unsubstantiated claims). For regulated categories (food, health, finance, cosmetics), note which words are regulated in the markets the brand sells to; research them if they matter (e.g. EU honey labelling: origin country mandatory, "pure"/"raw" contested; EU "organic" needs certification).

## DESIGN.md

Frontmatter tokens (see `examples/kestrel-tea/DESIGN.md` for a complete one):
```yaml
---
version: alpha
name: Brand Name
brand: BRAND.md
description: One sentence on scope and provenance.
colors:            # kebab-case names from the designer's color names
  ember-red: "#B23A2E"
  primary: "{colors.ember-red}"      # alias for the primary role
typography:        # one token per hierarchy level; fontSize = lower bound of the designer's range
  headline-lg: { fontFamily: Fraunces, fontSize: 64px, fontWeight: 600 }
rounded: { full: 9999px }            # only shapes the designer actually uses
omitted:           # sections the designer didn't define, with a reason, instead of inventing values
  - section: spacing
    reason: "The guidelines define no spacing scale or grid values."
components:        # the designer's REAL color pairings, so the linter checks their contrast
  logo-on-oxblood: { backgroundColor: "{colors.oxblood}", textColor: "{colors.paper-white}" }
---
```

Body sections, in this order: `## Overview`, `## Colors`, `## Typography`, `## Layout`, `## Elevation & Depth`, `## Shapes`, `## Components`, `## Do's and Don'ts`. A short preamble after the H1 names BRAND.md as authoritative for meaning, this file for values, and says conflicts go to a person.

Formats the example site generator parses (keep them, or adapt the parser):
- Colors tiers: a bold line starting a tier, exactly `**Primary.** note…`, `**Secondary / accent.** note…` or `**Background** *(PDF p.23)*:`, each followed by bullets `- **Ember Red (#B23A2E)** \`ember-red\`. description` (an alias may come first: `` `primary` / `ember-red` ``). The tier regex lives in `build.mjs` section 4: change it there if the brand's tiers are named differently. The build fails if a HEX in the prose disagrees with its token; that's deliberate.
- A CMYK table with header `| Color | CMYK (PDF label) |` and one row per named color (`not supplied` when missing).
- `**Combination rules.**` paragraph (the Color page shows everything from there on).
- Typography table: `| \`token\` | use | face | range |`.
- Do's and Don'ts as list items beginning `Do` / `Don't`.

### Lint and export

```sh
npx -y @google/design.md lint DESIGN.md        # JSON: summary.errors / summary.warnings, findings[]
npx -y @google/design.md export --format dtcg DESIGN.md          # W3C Design Tokens
npx -y @google/design.md export --format css-tailwind DESIGN.md  # Tailwind v4 @theme
```

Fix every error. Contrast **warnings on the designer's own pairings are findings, not bugs**: keep the pairing as designed, and add it to Open Items with the measured ratio (in the original library: white text on an amber pack, about 2.6:1). Don't "fix" a brand color to pass a linter.

## Final checks

- Every H3 the spec requires exists (grep the headings against the list above).
- Every HEX in BRAND.md matches DESIGN.md.
- Every *(proposal)* is listed in an Open Item asking for confirmation.
- No claim is phrased as approved.
- Lint: 0 errors.
