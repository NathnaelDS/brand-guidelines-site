---
version: alpha
name: Kestrel Tea
brand: BRAND.md
description: Visual system for Kestrel Tea™ packaging, print, social and web, transcribed from the Northfold Studio brand guidelines (January 2026) and the production artwork. Brand meaning, voice and claims live in BRAND.md. Fictional example brand.
colors:
  ember-red: "#B23A2E"
  oxblood: "#6B2E36"
  saffron: "#D6902B"
  marigold: "#EFC64A"
  pale-sage: "#C5C879"
  sage: "#56604A"
  harbour-blue: "#1D6F86"
  paper-white: "#F5F4F0"
  oat: "#EDE6D6"
  pine-ink: "#221E1C"
  primary: "{colors.ember-red}"
typography:
  display-caps:
    fontFamily: Bricolage Grotesque
    fontWeight: 800
  label-caps:
    fontFamily: Bricolage Grotesque
    fontSize: 20px
    fontWeight: 800
  headline-lg:
    fontFamily: Fraunces
    fontSize: 64px
    fontWeight: 600
  headline-md:
    fontFamily: Fraunces
    fontSize: 40px
    fontWeight: 500
  title-sm:
    fontFamily: Instrument Sans
    fontSize: 20px
    fontWeight: 400
  body-md:
    fontFamily: Instrument Sans
    fontSize: 18px
    fontWeight: 300
  label-cta:
    fontFamily: Instrument Sans
    fontSize: 22px
    fontWeight: 400
rounded:
  full: 9999px
omitted:
  - section: spacing
    reason: "The guidelines define no spacing scale or grid values."
components:
  button-cta:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.paper-white}"
    typography: "{typography.label-cta}"
    rounded: "{rounded.full}"
  logo-on-paper-white:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.primary}"
  logo-on-oxblood:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.paper-white}"
  logo-on-pine-ink:
    backgroundColor: "{colors.pine-ink}"
    textColor: "{colors.saffron}"
  card-oat:
    backgroundColor: "{colors.oat}"
    textColor: "{colors.ember-red}"
  tin-smoked-black:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.paper-white}"
  tin-white-peony:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ember-red}"
  tin-golden-oolong:
    backgroundColor: "{colors.saffron}"
    textColor: "{colors.paper-white}"
  badge-pale-sage:
    backgroundColor: "{colors.pale-sage}"
    textColor: "{colors.sage}"
  badge-harbour-blue:
    backgroundColor: "{colors.harbour-blue}"
    textColor: "{colors.paper-white}"
  badge-marigold-on-ink:
    backgroundColor: "{colors.pine-ink}"
    textColor: "{colors.marigold}"
---

# Kestrel Tea — Design System

> Fictional example. Kestrel Tea Co. and Northfold Studio do not exist; the file shows the structure, citation density and formats the skill produces.

Brand: [BRAND.md](BRAND.md). This file expresses that brand for packaging, print, social and web. BRAND.md is authoritative for meaning, voice and claims. This file is authoritative for concrete visual values. Report conflicts between the two to a person; don't resolve them silently.

**Provenance.** Values are transcribed from `2 - Brand Guidelines/Kestrel Tea - Brand Guidelines.pdf`, cited as *(PDF p.N)* using the viewer's page number. Where the artwork and the PDF labels disagree, the artwork wins *(artwork)*, and the conflict is logged in BRAND.md → Open Items. Anything the designer did not specify is either left out or marked *(proposal)*.

## Overview

Unhurried, precise and warm *(PDF p.15)*. The system pairs deep, mineral grounds (Oxblood, Pine Ink, Sage) with a single warm note of steeped tea (Saffron), and keeps the logo clear of competition. It deliberately avoids "the steam-and-teacup shorthand of every tea shelf" in favor of "something closer to a good bookshop" *(PDF p.33)*. Surfaces should feel tactile and quiet: rice-paper grain, a slow tile rhythm, generous empty space.

## Colors

The palette is sampled from the glazed tiles and painted warehouse doors of the old river port *(PDF p.19–20)*. It has three tiers, and the tiers matter.

**Primary.** The most dominant and recognizable colors. Use them in logos, key graphics and essential text *(PDF p.21, p.25)*.
- **Ember Red (#B23A2E)** `primary` / `ember-red`. The signature red. The default logo color on light grounds.
- **Oxblood (#6B2E36)** `oxblood`. Section covers, the gift box, the brand's deepest field.
- **Saffron (#D6902B)** `saffron`. The color of a steeped oolong. The logo color on Pine Ink.

**Secondary / accent.** Supporting colors for depth and variation. They must never overpower the primaries *(PDF p.22)*.
- **Marigold (#EFC64A)** `marigold`. *(The PDF label shows Ember Red's values by mistake. This is the swatch's real color.)*
- **Pale Sage (#C5C879)** `pale-sage`
- **Sage (#56604A)** `sage`. Smoked Black, and the call-to-action button.
- **Harbour Blue (#1D6F86)** `harbour-blue`

**Background** *(PDF p.23)*:
- **Paper White (#F5F4F0)** `paper-white`. The default light ground, and the "white" used for reversed logos.
- **Oat (#EDE6D6)** `oat`. Warm paper ground (business card back).
- **Pine Ink (#221E1C)** `pine-ink`. The near-black ground. Never use pure black.

**Print values.** CMYK as labeled in the PDF *(PDF p.21–23)*. Confirm with the printer before production. Two labels are known to be wrong (see BRAND.md Open Items 1–2).

| Color | CMYK (PDF label) |
|---|---|
| Ember Red | 0 / 67 / 74 / 30 (labeled against `#B23A3E`; recheck) |
| Oxblood | 0 / 57 / 50 / 58 |
| Saffron | 0 / 33 / 80 / 16 |
| Marigold | not supplied (PDF repeats Ember Red's values) |
| Pale Sage | 2 / 0 / 40 / 22 |
| Sage | 10 / 0 / 23 / 62 |
| Harbour Blue | 78 / 17 / 0 / 47 |
| Paper White | 0 / 0 / 2 / 4 |
| Oat | 0 / 3 / 10 / 7 |
| Pine Ink | 0 / 12 / 18 / 87 |

**Combination rules.**
- **Approved logo / ground pairs** *(PDF p.24)*:
  - Ember Red logo on Paper White
  - Paper White logo on Oxblood
  - Saffron logo on Pine Ink
- **Primary combinations** *(PDF p.25)*: primary colors lead. Secondary, accent and background colors play only supporting roles.
- **Auxiliary combinations** *(PDF p.26)*: secondary, accent or background colors may take the lead **only on packaging or special scenarios**, and must never replace the primaries as the visual focus.

**Tints.** The PDF shows three lighter steps under each swatch *(PDF p.21–23)* but gives no values for them. Don't invent tints. Some unlisted colors exist in the asset files (see BRAND.md Open Item 3); don't use them for new work until they are approved.

## Typography

Three families, each with a fixed job *(PDF p.28–30)*:

- **Bricolage Grotesque** is the packaging font and the display voice: section titles, badges, campaign headlines. Set in ExtraBold, ALL CAPS.
- **Fraunces** carries headlines.
- **Instrument Sans** carries subheaders, body text and buttons.

The hierarchy on *(PDF p.30)* gives size **ranges**. Each token uses the bottom of its range. Scale within the range for the medium and the application.

| Token | Use | Family / weight | Size range |
|---|---|---|---|
| `display-caps` | Covers, campaign and post headlines ("TEA, TAKEN SLOWLY.") | Bricolage Grotesque ExtraBold, all caps | not specified |
| `label-caps` | Context labels ("KESTREL SMOKED BLACK") | Bricolage Grotesque ExtraBold, all caps | 20–24px |
| `headline-lg` | Large headlines | Fraunces SemiBold | 64–80px |
| `headline-md` | Medium headlines | Fraunces Medium | 40–48px |
| `title-sm` | Small headlines and in-body headlines | Instrument Sans Regular | 20–24px |
| `body-md` | Body text | Instrument Sans Light | 18–22px |
| `label-cta` | Buttons and calls to action | Instrument Sans Regular | 22–28px |

Line height and letter spacing are not specified. The PDF says only that Instrument Sans is "opened up slightly" for long passages *(PDF p.29)*. The PDF also says scale "will vary depending on material and application"; keep the relative weight and scale of each level as close to the examples as possible *(PDF p.30)*.

The handwritten tasting notes on the tins are set in **Quill Hand** *(artwork)*. It isn't supplied in the fonts folder, so it has no token yet.

## Layout

The guidelines define no grid or spacing values, so spacing is omitted from the tokens. What the designer did specify or consistently show:

- **Logo placement:** "Sit the logo on the first column line, flush left, so it reads before anything else." If space is short, use the top-left or bottom-left corner *(PDF p.16)*.
- **Document and slide pages** *(artwork, every content page)*:
  - a top strip of small metadata (section, page number, "Kestrel Tea™ Brand Guidelines")
  - a single hairline rule beneath it
  - the page title at left
  - one or two short text columns beside it
  - generous empty space
- **Social posts** are portrait, about 4:5 (1080 × 1350 px source) *(artwork)*. The headline sits at the top or bottom; the small mark sits in a corner with the URL opposite.
- **Packaging:**
  - Tins are vertical. Centered mark, then the English tea name, then a hairline rule, then the Portuguese name, with the origin line and net weight at the foot *(artwork)*.
  - The gift box uses an Oxblood field with the tile pattern *(artwork)*.

## Elevation & Depth

Flat. Depth comes from **tonal grounds and texture**, not shadows:
- dark fields of Oxblood, Pine Ink and Sage
- the Complex tile pattern as a low-contrast tonal layer *(PDF p.35–36)*
- rice-paper grain *(PDF p.32)*

Never apply drop shadows to the logo *(PDF p.17)*.

## Shapes

- **Buttons and CTAs** are full pills (`rounded.full`), e.g. the "kestreltea.example" button *(PDF p.30)*.
- **Badges** come in three enclosures:
  - circle ("Blended by Hand · EST 2024")
  - framed rectangle
  - arch ("Single Estate · EST 2024") *(PDF p.12–14)*
- **Pattern geometry** is the square tile quarter, softened in the Complex pattern into "a slower, woven rhythm" *(PDF p.35)*.
- Corner radii for cards and panels are not specified. *(proposal)* Default to square corners in print, and keep any rounding small and consistent.

## Components

Each component below records a color pairing the designer actually used. That lets the linter check its contrast.

- **button-cta:** Sage pill, Paper White text in Instrument Sans Regular *(PDF p.30)*.
- **logo-on-paper-white / logo-on-oxblood / logo-on-pine-ink:** the three approved logo/ground pairs *(PDF p.24)*.
- **card-oat:** Ember Red type on Oat (business card back) *(artwork)*.
- **tin-smoked-black / tin-white-peony / tin-golden-oolong:** the three standard tin colorways *(artwork)*.
  - The production Golden Oolong tin uses `#D58F2A`, 1 step off Saffron. The token uses the palette value.
  - **Contrast warning:** Paper White text on Saffron measures **2.42:1**. That is below WCAG AA for normal text (4.5:1) and for large text (3:1). It is the designer's choice and is kept as-is. Use it only for large display type, as on the tin, and flag it before using it anywhere else.
- **badge-pale-sage / badge-harbour-blue / badge-marigold-on-ink:** auxiliary badge colorways from the social kit *(artwork)*. Under the auxiliary rule, they are for packaging and special moments only.
  - **Contrast note:** Sage on Pale Sage measures **3.76:1**. It passes for large text (3:1) but not for normal text (4.5:1). Fine for the badge's large lettering; don't use it for small type.

## Do's and Don'ts

- Do use the supplied logo files from `1 - Source Files/1 - Logo Files/`. Never redraw or retype the logo.
- Do use the horizontal lockup by default. Use vertical when width is limited, and secondary or badge for small and seal-like uses *(PDF p.8–14)*.
- Do keep the logo on approved grounds with strong contrast. On photos or textures, keep it clear of busy or high-contrast areas *(PDF p.15)*.
- Do let primary colors lead. Use auxiliary combinations only on packaging or special scenarios *(PDF p.26)*.
- Do pair every English tea name with its Portuguese name on packaging.
- Don't stretch, rotate, rearrange, recolor, shadow or blur the logo, or place it on a bad-contrast background *(PDF p.17)*.
- Don't use pure black or pure white as grounds. Use Pine Ink and Paper White.
- Don't use literal tea clichés (steam curls, teacup silhouettes, leaf sprigs) as the main idea *(PDF p.33)*.
- Don't introduce colors, tints or gradients outside this file.
- Don't reuse mockup placeholder content (names, phone numbers, prices, follower counts) as real content.
