// Builds the Kestrel Tea brand website into ./dist from ../BRAND.md and ../DESIGN.md.
// Text and values come from those two files; this script only lays them out.
// Usage: npm run build   (env: SITE_URL=https://brand.example.com, EMBED_FONTS=false,
//                         BRAND_LIBRARY=/path/to/Kestrel Tea - Brand Library (2026))

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import yaml from 'js-yaml';
import { marked } from 'marked';

const SITE = import.meta.dirname;
const ROOT = path.resolve(SITE, process.env.BRAND_LIBRARY || '..');
if (!fs.existsSync(path.join(ROOT, 'BRAND.md'))) {
  throw new Error(`No BRAND.md in ${ROOT}. Set BRAND_LIBRARY to the brand library folder.`);
}
const DIST = path.join(SITE, 'dist');
const CACHE = path.join(SITE, '.cache');
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');
const EMBED_FONTS = process.env.EMBED_FONTS !== 'false';

const lib = (...p) => path.join(ROOT, ...p);
const out = (...p) => path.join(DIST, ...p);
const mkdir = (d) => fs.mkdirSync(d, { recursive: true });
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', ...opts });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fresh = (src, dest) => fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs;

const PDF = lib('2 - Brand Guidelines', 'Kestrel Tea - Brand Guidelines.pdf');
const DESIGN_CLI = path.join(SITE, 'node_modules', '.bin', 'design.md');

// ---------------------------------------------------------------------------
// 1. Validate DESIGN.md with the official linter; stop on errors.

const lint = JSON.parse(run(DESIGN_CLI, ['lint', lib('DESIGN.md')]));
if (lint.summary.errors > 0) {
  console.error(lint.findings.filter((f) => f.severity === 'error'));
  throw new Error('DESIGN.md has lint errors; fix them before building.');
}

// ---------------------------------------------------------------------------
// 2. Parse the two source files.

function splitFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  return { data: yaml.load(m[1]), body: text.slice(m[0].length) };
}

// Groups markdown into { preface, chapters: [{ title, tokens, sections: [{ title, tokens }] }] }.
function outline(body) {
  const doc = { preface: [], chapters: [] };
  let chapter = null;
  let section = null;
  for (const t of marked.lexer(body)) {
    if (t.type === 'heading' && t.depth === 1) continue;
    if (t.type === 'heading' && t.depth === 2) {
      chapter = { title: t.text, tokens: [], sections: [] };
      section = null;
      doc.chapters.push(chapter);
    } else if (t.type === 'heading' && t.depth === 3 && chapter) {
      section = { title: t.text, tokens: [] };
      chapter.sections.push(section);
    } else {
      (section?.tokens ?? chapter?.tokens ?? doc.preface).push(t);
    }
  }
  return doc;
}

const brandSrc = fs.readFileSync(lib('BRAND.md'), 'utf8');
const designSrc = fs.readFileSync(lib('DESIGN.md'), 'utf8');
const brand = splitFrontmatter(brandSrc);
const design = splitFrontmatter(designSrc);
const brandDoc = outline(brand.body);
const designDoc = outline(design.body);

const chapterOf = (doc, title) => {
  const c = doc.chapters.find((c) => c.title === title);
  if (!c) throw new Error(`Missing chapter "${title}"`);
  return c;
};
const sectionOf = (doc, chapter, title) => {
  const s = chapterOf(doc, chapter).sections.find((s) => s.title === title);
  if (!s) throw new Error(`Missing section "${chapter} > ${title}"`);
  return s;
};

// ---------------------------------------------------------------------------
// 3. Markdown rendering with provenance markers made visible and linked.

const pageImg = (n) => `pages/p-${String(n).padStart(2, '0')}.webp`;

function provenance(html) {
  // *(PDF p.6)*, *(artwork)*, *(proposal)* → labeled chips.
  html = html.replace(/<em>\(([^<]*?)\)<\/em>/g, (m, inner) => {
    const kind = /^proposal/i.test(inner) ? 'proposal' : /^artwork/i.test(inner) ? 'artwork' : /^PDF/.test(inner) ? 'pdf' : null;
    return kind ? `<span class="src src--${kind}">${inner}</span>` : m;
  });
  // "PDF p.12–14, p.20" → each page reference links to the rendered original page.
  html = html.replace(/PDF (p\.\d+(?:[–-]\d+)?(?:,\s*p\.\d+(?:[–-]\d+)?)*)/g, (m, run) =>
    'PDF ' + run.replace(/p\.(\d+)((?:[–-]\d+)?)/g, (r, n, range) =>
      `<a class="pref" href="${pageImg(n)}" title="Open page ${n} of the original guidelines">p.${n}${range}</a>`));
  // Do / Don't list items get a marker class.
  html = html.replace(/<li>(Do(?:n(?:'|’|&#39;)t)?)\b/g, (m, w) => `<li class="${w === 'Do' ? 'do' : 'dont'}">${w}`);
  return html;
}
const md = (tokens) => provenance(marked.parser(tokens));
const mdText = (text) => provenance(marked.parse(text));
const mdInline = (text) => provenance(marked.parseInline(text));

// ---------------------------------------------------------------------------
// 4. Design data from DESIGN.md (tokens + the tables in its prose).

const tokens = design.data;
const resolve = (v) => {
  const m = typeof v === 'string' && v.match(/^\{(.+)\}$/);
  if (!m) return v;
  return resolve(m[1].split('.').reduce((o, k) => o[k], tokens));
};
const colorTokens = Object.fromEntries(Object.entries(tokens.colors).map(([k, v]) => [k, resolve(v)]));

const designColorsMd = sectionMarkdown(designSrc, 'Colors');
const designTypeMd = sectionMarkdown(designSrc, 'Typography');

function sectionMarkdown(src, heading) {
  const m = src.match(new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm'));
  if (!m) throw new Error(`DESIGN.md has no "## ${heading}"`);
  return m[1];
}

// Palette tiers: the bold tier lines and "- **Name (#HEX)** `token`. description" bullets.
const tiers = [];
for (const line of designColorsMd.split('\n')) {
  const tier = line.match(/^\*\*(Primary|Secondary \/ accent|Background)\b[^*]*\*\*\s*(.*)$/);
  if (tier) { tiers.push({ name: tier[1], note: tier[2], colors: [] }); continue; }
  const c = line.match(/^- \*\*(.+?) \((#[0-9A-Fa-f]{6})\)\*\* `([a-z-]+)`(?: \/ `([a-z-]+)`)?\.?\s*(.*)$/);
  if (c && tiers.length) {
    const [, name, hex, tok1, tok2, desc] = c;
    const token = tok2 || tok1;
    if (colorTokens[token]?.toUpperCase() !== hex.toUpperCase()) {
      throw new Error(`DESIGN.md prose says ${name} is ${hex} but token "${token}" is ${colorTokens[token]}`);
    }
    tiers.at(-1).colors.push({ name, hex: hex.toUpperCase(), token, desc });
  }
}
const cmyk = {};
for (const row of designColorsMd.matchAll(/^\| ([A-Z][A-Za-z ]+?) \| ([^|]+?) \|$/gm)) {
  if (row[1] !== 'Color') cmyk[row[1]] = row[2];
}
const typeRanges = {};
for (const row of designTypeMd.matchAll(/^\| `([a-z-]+)` \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)) {
  typeRanges[row[1]] = { use: row[2].trim(), face: row[3].trim(), range: row[4].trim() };
}

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const onColor = (hex) => (luminance(hex) > 0.4 ? colorTokens['pine-ink'] : colorTokens['paper-white']);

// ---------------------------------------------------------------------------
// 5. Assets: copy and optimize source files into dist (cached in .cache).

// Empty dist rather than deleting it, so a running preview server keeps working.
mkdir(DIST);
for (const f of fs.readdirSync(DIST)) fs.rmSync(path.join(DIST, f), { recursive: true, force: true });
mkdir(CACHE);

function webp(src, name, width, quality = 80) {
  const cached = path.join(CACHE, `${name}-${width}.webp`);
  if (!fresh(src, cached)) run('cwebp', ['-quiet', '-q', String(quality), '-resize', String(width), '0', src, '-o', cached]);
  const dest = out('img', `${name}.webp`);
  mkdir(path.dirname(dest));
  fs.copyFileSync(cached, dest);
  const [w, h] = run('magick', ['identify', '-format', '%w %h', cached]).split(' ').map(Number);
  return { src: `img/${name}.webp`, w, h };
}

// Original guideline pages, rendered from the PDF.
const pageCache = path.join(CACHE, 'pages');
mkdir(pageCache);
if (!fs.existsSync(path.join(pageCache, 'p-50.webp')) || !fresh(PDF, path.join(pageCache, 'p-50.webp'))) {
  run('pdftoppm', ['-r', '72', '-png', PDF, path.join(pageCache, 'p')]);
  for (const f of fs.readdirSync(pageCache).filter((f) => f.endsWith('.png'))) {
    run('cwebp', ['-quiet', '-q', '78', path.join(pageCache, f), '-o', path.join(pageCache, f.replace('.png', '.webp'))]);
    fs.rmSync(path.join(pageCache, f));
  }
}
const pageCount = fs.readdirSync(pageCache).filter((f) => f.endsWith('.webp')).length;
fs.cpSync(pageCache, out('pages'), { recursive: true });

// Logos: every supplied SVG, plus mark-only versions cropped from the horizontal lockup.
const LOGO_DIR = lib('1 - Source Files', '1 - Logo Files');
const logos = {};
for (const variant of fs.readdirSync(LOGO_DIR).filter((d) => /^\d - /.test(d))) {
  const svgDir = path.join(LOGO_DIR, variant, 'SVG');
  logos[variant] = {};
  for (const f of fs.readdirSync(svgDir).filter((f) => f.endsWith('.svg'))) {
    const rel = `logos/${slug(variant)}/${slug(f.replace(/\.svg$/, ''))}.svg`;
    mkdir(path.dirname(out(rel)));
    fs.copyFileSync(path.join(svgDir, f), out(rel));
    logos[variant][f.replace(/\.svg$/, '')] = rel;
  }
}
const logo = (variant, file) => {
  const rel = logos[variant]?.[file];
  if (!rel) throw new Error(`Missing logo file ${variant}/${file}`);
  return rel;
};
// The mark occupies x 193–425, y 158–393 of the 1080 × 550 horizontal lockup.
for (const color of ['Red', 'Paper', 'Saffron']) {
  const svg = fs.readFileSync(path.join(LOGO_DIR, '2 - Horizontal Lockup', 'SVG', `Primary - H - English - ${color}.svg`), 'utf8');
  fs.writeFileSync(out('logos', `mark-${color.toLowerCase()}.svg`), svg.replace('viewBox="0 0 1080 550"', 'viewBox="185 150 248 251"'));
}

// Brand assets: element and pattern SVGs, texture as WebP.
const ASSET_DIR = lib('1 - Source Files', '2 - Brand Assets');
const assetGrounds = ['Light BG', 'Saffron', 'Oxblood', 'Sage', 'Dark BG'];
const assets = { element: {}, pattern: {}, texture: {} };
for (const g of assetGrounds) {
  for (const [kind, folder] of [['element', '1 - Brand Element'], ['pattern', '2 - Brand Pattern']]) {
    const rel = `assets/${kind}-${slug(g)}.svg`;
    mkdir(out('assets'));
    fs.copyFileSync(path.join(ASSET_DIR, folder, 'SVG', `Brand Asset (${kind[0].toUpperCase() + kind.slice(1)}) - ${g}.svg`), out(rel));
    assets[kind][g] = rel;
  }
  assets.texture[g] = webp(path.join(ASSET_DIR, '3 - Brand Texture', `Brand Asset (Texture) - ${g}.png`), `texture-${slug(g)}`, 1400).src;
}

// Applications: mockups, social posts, packaging.
const MOCKUPS = [
  ['1 - Coaster.jpg', 'Coaster'], ['2 - Socials.png', 'Social media'], ['3 - Business Cards.jpg', 'Business cards'],
  ['4 - ID Card.jpg', 'ID card'], ['5 - Light Box.jpg', 'Light box sign'], ['6 - Billboard.jpg', 'Billboard'],
].map(([f, label]) => ({ label, ...webp(lib('5 - Mockups', f), `mockup-${slug(label)}`, 1800, 76) }));
const POSTS = [1, 2, 3, 4].map((n) => ({
  label: `Post ${n}`,
  ...webp(lib('3 - Brand Collaterals', '3 - Social Media Kit', '3 - Posts', `Post - ${n}.png`), `post-${n}`, 700),
}));
const PACK = lib('4 - Packaging (Master)');
const PACKAGING = [
  ['1 - Tins (Standard)/1 - 50 Grams/PNG/Tin 50g - Smoked Black@4x.png', 'Smoked Black tin, 50 g'],
  ['1 - Tins (Standard)/1 - 50 Grams/PNG/Tin 50g - White Peony@4x.png', 'White Peony tin, 50 g'],
  ['1 - Tins (Standard)/1 - 50 Grams/PNG/Tin 50g - Golden Oolong@4x.png', 'Golden Oolong tin, 50 g'],
  ['3 - Gift Box/PNG/Front.png', 'Gift box, front'],
  ['3 - Gift Box/PNG/Side - A.png', 'Gift box, side A'],
  ['3 - Gift Box/PNG/Side - B.png', 'Gift box, side B'],
].map(([f, label]) => ({ label, ...webp(path.join(PACK, f), `pack-${slug(label)}`, 900) }));

// Fonts (only when licensed for web use; see README).
const FONT_DIR = lib('1 - Source Files', '3 - Brand Fonts');
const FONTS = [
  ['Fraunces', 'Fraunces/Fraunces-VF.ttf', '400 700', 'normal'],
  ['Instrument Sans', 'Instrument Sans/InstrumentSans-Light.ttf', '300', 'normal'],
  ['Instrument Sans', 'Instrument Sans/InstrumentSans-Regular.ttf', '400', 'normal'],
  ['Instrument Sans', 'Instrument Sans/InstrumentSans-SemiBold.ttf', '600', 'normal'],
  ['Bricolage Grotesque', 'Bricolage Grotesque/BricolageGrotesque-Regular.ttf', '400', 'normal'],
  ['Bricolage Grotesque', 'Bricolage Grotesque/BricolageGrotesque-ExtraBold.ttf', '800', 'normal'],
];
let fontFaces = '';
if (EMBED_FONTS) {
  mkdir(out('fonts'));
  for (const [family, file, weight, style] of FONTS) {
    const name = slug(path.basename(file).replace(/\.\w+$/, '')) + path.extname(file);
    fs.copyFileSync(path.join(FONT_DIR, file), out('fonts', name));
    const format = name.endsWith('.otf') ? 'opentype' : 'truetype';
    fontFaces += `@font-face{font-family:"${family}";src:url("fonts/${name}") format("${format}");font-weight:${weight};font-style:${style};font-display:swap}\n`;
  }
}

// Downloads.
mkdir(out('downloads'));
fs.copyFileSync(PDF, out('downloads', 'Kestrel-Tea-Brand-Guidelines.pdf'));
const zipPath = path.join(CACHE, 'Kestrel-Tea-Logos.zip');
if (!fs.existsSync(zipPath) || !fresh(LOGO_DIR, zipPath)) {
  fs.rmSync(zipPath, { force: true });
  run('zip', ['-qr', zipPath, '1 - Logo Files', '-x', '*.DS_Store', '*.ai', '*.eps'], { cwd: lib('1 - Source Files') });
}
fs.copyFileSync(zipPath, out('downloads', 'Kestrel-Tea-Logos.zip'));
const zipMb = (fs.statSync(zipPath).size / 1e6).toFixed(1);

// Machine-readable sources, served at stable URLs.
fs.copyFileSync(lib('BRAND.md'), out('BRAND.md'));
fs.copyFileSync(lib('DESIGN.md'), out('DESIGN.md'));
fs.writeFileSync(out('tokens.json'), run(DESIGN_CLI, ['export', '--format', 'dtcg', lib('DESIGN.md')]));
fs.writeFileSync(out('tailwind-theme.css'), run(DESIGN_CLI, ['export', '--format', 'css-tailwind', lib('DESIGN.md')]));

// Site CSS: brand tokens as custom properties + font faces + the stylesheet.
const cssVars = Object.entries(colorTokens).map(([k, v]) => `--${k}:${v};`).join('');
fs.writeFileSync(out('styles.css'), `${fontFaces}:root{${cssVars}}\n${fs.readFileSync(path.join(SITE, 'src', 'styles.css'), 'utf8')}`);
fs.copyFileSync(path.join(SITE, 'src', 'site.js'), out('site.js'));
fs.copyFileSync(out('logos', 'mark-red.svg'), out('favicon.svg'));

// ---------------------------------------------------------------------------
// 6. Page templates.

const PAGES = [
  { file: 'index.html', num: '', title: 'Home', cover: 'Brand Guidelines' },
  { file: 'strategy.html', num: '01', title: 'Strategy', cover: 'Strategy' },
  { file: 'voice.html', num: '02', title: 'Voice', cover: 'Voice' },
  { file: 'logo.html', num: '03', title: 'Logo', cover: 'Logo Design' },
  { file: 'color.html', num: '04', title: 'Color', cover: 'Color Palette' },
  { file: 'typography.html', num: '05', title: 'Typography', cover: 'Typography' },
  { file: 'assets.html', num: '06', title: 'Brand Assets', cover: 'Brand Assets' },
  { file: 'design-system.html', num: '07', title: 'Design System', cover: 'Design System' },
  { file: 'governance.html', num: '08', title: 'Governance', cover: 'Governance' },
  { file: 'use.html', num: '09', title: 'How to Use', cover: 'How to Use' },
  { file: 'original.html', num: '10', title: 'Original PDF', cover: 'Original Guidelines' },
];

const AI_PROMPT = 'Read the Kestrel Tea brand files at {base}BRAND.md and {base}DESIGN.md and follow them for anything you write or design for Kestrel Tea. Check the Claims section before stating any fact about the product.';

function nav(current) {
  return PAGES.map((p) => `<li><a href="${p.file}"${p.file === current.file ? ' aria-current="page"' : ''}><span>${p.num || '00'}</span>${esc(p.title)}</a></li>`).join('');
}

function metaStrip(page, label) {
  return `<div class="meta-strip" aria-hidden="true"><span>${esc(page.title)}<br>${esc(label)}</span><span>Kestrel Tea™<br>Brand Guidelines</span><span>Designed —<br>January 2026</span><img src="logos/mark-red.svg" alt=""></div>`;
}

// A content block in the designer's page pattern: metadata strip, hairline, title left, text right.
function block(page, { title, html = '', visual = '', id = slug(title), wide = false }) {
  return `<section class="block${wide ? ' block--wide' : ''}" id="${id}">
${metaStrip(page, title)}
<div class="block-grid"><h2>${esc(title)}</h2><div class="prose">${html}</div></div>
${visual}
</section>`;
}

function layout(page, { lede = '', toc = [], body, description }) {
  const tocHtml = toc.length ? `<ol class="cover-toc">${toc.map((t, i) => `<li><a href="#${slug(t)}"><span>${page.num ? `${+page.num}.${i + 1}` : String(i + 1).padStart(2, '0')}</span>${esc(t)}</a></li>`).join('')}</ol>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.title === 'Home' ? 'Kestrel Tea Brand Guidelines' : `${page.title} · Kestrel Tea Brand Guidelines`)}</title>
<meta name="description" content="${esc(description || brand.data.tagline)}">
<meta name="theme-color" content="${colorTokens.oxblood}">
${SITE_URL ? `<meta name="site-url" content="${SITE_URL}/">` : ''}
<link rel="alternate" type="text/markdown" href="BRAND.md" title="BRAND.md: brand strategy, voice and claims">
<link rel="alternate" type="text/markdown" href="DESIGN.md" title="DESIGN.md: design tokens and rules">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <a class="brand" href="index.html"><img src="${logo('2 - Horizontal Lockup', 'Primary - H - English - Red')}" alt="Kestrel Tea"><span>Brand Guidelines<br>2026</span></a>
  <a class="topbar-ai" href="use.html#for-ai-agents">For AI agents</a>
  <details class="menu"><summary>Menu</summary><nav aria-label="Chapters (mobile)"><ol>${nav(page)}</ol></nav></details>
</header>
<div class="layout">
<aside class="sidebar"><div class="nav-label">The guidelines</div><nav aria-label="Chapters"><ol>${nav(page)}</ol></nav>
  <div class="sidebar-files"><div class="nav-label">Source files</div><a href="BRAND.md">BRAND.md</a><a href="DESIGN.md">DESIGN.md</a><a href="tokens.json">tokens.json</a></div>
  <small>Identity by Northfold Studio™<br>Kestrel Tea Co. · Porto</small></aside>
<main id="main">
<section class="cover">
  <svg class="cover-x" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="28,0 72,0 50,50"/><polygon points="28,100 72,100 50,50"/></svg>
  <div class="cover-head"><img src="logos/mark-paper.svg" alt=""><span>Designed by:<br><b>Northfold Studio™</b></span></div>
  ${lede ? `<p class="cover-lede">${lede}</p>` : ''}
  ${tocHtml}
  <div class="cover-foot"><h1>${esc(page.cover)}</h1>${page.num ? `<span class="cover-num">${+page.num}</span>` : ''}</div>
</section>
${body}
<footer class="footer">
  <span>Kestrel Tea™ Brand Guidelines · Designed — January 2026 · Northfold Studio™</span>
  <span>Built from <a href="BRAND.md">BRAND.md</a> + <a href="DESIGN.md">DESIGN.md</a> · ${esc(brand.data.name)} v${brand.data.version}</span>
</footer>
</main>
</div>
<div id="toast" role="status" aria-live="polite"></div>
<script src="site.js" defer></script>
</body>
</html>
`;
}

const sectionsToBlocks = (page, sections) => sections.map((s) => block(page, { title: s.title, html: md(s.tokens) })).join('');

function tile({ src, alt, bg, caption, cls = '' }) {
  return `<figure class="tile ${cls}"><div class="tile-art" style="background:${bg}"><img src="${src}" alt="${esc(alt)}" loading="lazy"></div>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
}
const pageLink = (n, label = `Original page ${n}`) => `<a class="pref" href="${pageImg(n)}">${esc(label)} ↗</a>`;

// ---------------------------------------------------------------------------
// 7. Pages.

const pages = {};

// Home
{
  const page = PAGES[0];
  const chapters = PAGES.slice(1).map((p) => `<li><a href="${p.file}"><span>${p.num}</span><strong>${esc(p.title)}</strong></a></li>`).join('');
  const files = `<ul class="files">
    <li><a href="BRAND.md"><strong>BRAND.md</strong><small>Strategy, voice, approved identity and claims. BRAND.md spec 0.3.0</small></a></li>
    <li><a href="DESIGN.md"><strong>DESIGN.md</strong><small>Design tokens, combinations and component rules. Google DESIGN.md format</small></a></li>
    <li><a href="tokens.json"><strong>tokens.json</strong><small>W3C Design Tokens 2025.10, for Figma and code</small></a></li>
    <li><a href="downloads/Kestrel-Tea-Logos.zip" download><strong>Logo files</strong><small>All lockups and badges, SVG + PNG, ${zipMb} MB</small></a></li>
    <li><a href="downloads/Kestrel-Tea-Brand-Guidelines.pdf" download><strong>Original guidelines PDF</strong><small>Northfold Studio, January 2026, 50 pages</small></a></li>
  </ul>`;
  pages[page.file] = layout(page, {
    lede: mdInline(sectionOf(brandDoc, 'Strategy', 'Promise').tokens.find((t) => t.type === 'paragraph' && /Base message/.test(t.raw))?.text.replace(/^\*\*Base message\*\*[^:]*:\s*/, '') ?? ''),
    toc: ['Welcome', 'Chapters', 'For AI agents', 'Downloads'],
    body: [
      block(page, { title: 'Welcome', html: md(brandDoc.preface) }),
      block(page, { title: 'Chapters', html: '<p>The guidelines in ten chapters. Every value on these pages is generated from the brand source files, so the site, the files and the tokens always match.</p>', visual: `<ol class="chapters">${chapters}</ol>` }),
      block(page, {
        title: 'For AI agents',
        html: `<p>This brand is published for both people and AI tools. Agents should read the Markdown sources directly. They are plain text at stable URLs.</p>
<ol><li><a href="BRAND.md"><code>BRAND.md</code></a>: who Kestrel Tea is, how it speaks, what it may claim.</li><li><a href="DESIGN.md"><code>DESIGN.md</code></a>: exact colors, type scale, combinations and components.</li><li><a href="llms.txt"><code>llms.txt</code></a>: an index of everything here.</li></ol>
<p class="ai-actions"><a class="btn" data-ai="claude" href="https://claude.ai/new">Open in Claude ↗</a> <a class="btn btn--ghost" data-ai="chatgpt" href="https://chatgpt.com/">Open in ChatGPT ↗</a> <button class="btn btn--ghost" data-copy-prompt type="button">Copy prompt</button></p>
<p>See <a href="use.html">How to Use</a> for setup in Claude, ChatGPT, Claude Code and design tools.</p>`,
      }),
      block(page, { title: 'Downloads', html: '<p>Approved artwork and the machine-readable brand. Always use supplied artwork; never redraw the logo.</p>', visual: files }),
    ].join(''),
  });
}

// Strategy
{
  const page = PAGES[1];
  const ch = chapterOf(brandDoc, 'Strategy');
  pages[page.file] = layout(page, {
    lede: 'Why Kestrel Tea exists, who it serves and where it stands.',
    toc: ch.sections.map((s) => s.title),
    body: sectionsToBlocks(page, ch.sections),
  });
}

// Voice: the designer's tone sliders (PDF p.4) lead the chapter.
{
  const page = PAGES[2];
  const ch = chapterOf(brandDoc, 'Voice');
  // Marker positions measured from the rendered PDF page 4 (track x 673–1462 at 1600 px).
  const sliders = [['Formal', 'Informal / Casual', 27], ['Friendly', 'Professional', 50], ['High-energy', 'Serious', 58], ['Fun', 'Exclusive', 66], ['Enthusiastic', 'Matter of fact', 50], ['Traditional', 'Nontraditional', 33], ['Realistic', 'Idealistic', 33]];
  const tone = `<div class="sliders" role="list">${sliders.map(([a, b, v]) => `<div class="slider" role="listitem" aria-label="${a} to ${b}: ${v}% toward ${b}"><span>${a}</span><span>${b}</span><i style="--v:${v}%"></i></div>`).join('')}</div>`;
  pages[page.file] = layout(page, {
    lede: 'Unhurried, precise and warm. Knowledge without lecturing, craft without fuss, quality without exaggeration.',
    toc: ['Tone of Voice', ...ch.sections.map((s) => s.title)],
    body: block(page, {
      title: 'Tone of Voice',
      html: `<p>The designer's tone scale. Each marker shows where Kestrel sits between two poles. Kestrel "speaks quietly and exactly, the way you would explain a tea to a friend at the counter." ${pageLink(4, 'PDF p.4')}</p>`,
      visual: tone,
    }) + sectionsToBlocks(page, ch.sections),
  });
}

// Logo
{
  const page = PAGES[3];
  const marks = sectionOf(brandDoc, 'Visual', 'Logo & Marks');
  const H = '2 - Horizontal Lockup', V = '1 - Vertical Lockup', S = '3 - Secondary Lockup';
  const lockups = [
    tile({ src: logo(H, 'Primary - H - English - Red'), alt: 'Horizontal lockup, English, Ember Red', bg: colorTokens['paper-white'], caption: '<b>Horizontal</b> · primary version' }),
    tile({ src: logo(H, 'Primary - H - Portuguese - Paper'), alt: 'Horizontal lockup, Portuguese, Paper White', bg: colorTokens.oxblood, caption: '<b>Horizontal</b> · Portuguese' }),
    tile({ src: logo(V, 'Primary - V - English - Saffron'), alt: 'Vertical lockup, English, Saffron', bg: colorTokens['pine-ink'], caption: '<b>Vertical</b> · limited width, centered layouts' }),
    tile({ src: logo(V, 'Primary - V - Portuguese - Saffron'), alt: 'Vertical lockup, Portuguese, Saffron', bg: colorTokens['pine-ink'], caption: '<b>Vertical</b> · Portuguese' }),
    tile({ src: logo(S, 'Secondary - English - Red'), alt: 'Secondary lockup, English, Red', bg: colorTokens['paper-white'], caption: '<b>Secondary</b> · packaging details, seals, small formats' }),
    tile({ src: logo(S, 'Secondary - Portuguese - Red'), alt: 'Secondary lockup, Portuguese, Red', bg: colorTokens['paper-white'], caption: '<b>Secondary</b> · Portuguese' }),
  ].join('');
  const badges = [
    tile({ src: logo('4 - Badge - Alt. 1', 'Badge - Alt 1 - Fill - Red'), alt: 'Circular badge, Red fill', bg: colorTokens['paper-white'], caption: '<b>Circular badge</b> · Blended by Hand', cls: 'tile--badge' }),
    tile({ src: logo('5 - Badge - Alt. 2', 'Badge - Alt 2 - Fill - Saffron'), alt: 'Rectangular badge, Saffron fill', bg: colorTokens['paper-white'], caption: '<b>Rectangular badge</b>', cls: 'tile--badge' }),
    tile({ src: logo('6 - Badge - Alt. 3', 'Badge - Alt 3 - Outline - Paper'), alt: 'Arched badge, Paper White outline', bg: colorTokens.oxblood, caption: '<b>Arched badge</b> · Single Estate', cls: 'tile--badge' }),
  ].join('');
  const colorways = ['Red', 'Saffron', 'Sage', 'Ink', 'Paper'].map((c) => tile({
    src: logo(H, `Primary - H - English - ${c}`), alt: `Horizontal lockup, ${c} colorway`,
    bg: c === 'Paper' ? colorTokens['pine-ink'] : colorTokens['paper-white'], caption: `<b>${c}</b>`, cls: 'tile--small',
  })).join('');
  pages[page.file] = layout(page, {
    lede: 'A kestrel’s wing folded into a single tea leaf, with a counter that echoes the lattice of an azulejo tile.',
    toc: ['Logomark', 'Lockups', 'Badges', 'Colorways', 'Logo Misuse', 'Logo Rules'],
    body: [
      block(page, { title: 'Logomark', html: `${md(marks.tokens.filter((t) => t.type === 'list').slice(0, 1).map((l) => ({ ...l, items: l.items.slice(0, 1) })))}<p>${pageLink(6, 'Construction, PDF p.6')}</p>`, visual: `<div class="hero-mark"><img src="logos/mark-red.svg" alt="Kestrel Tea logomark"></div>` }),
      block(page, { title: 'Lockups', html: '<p>The horizontal lockup is "often the primary logo version." Use vertical where width is limited, and secondary for close-up brand moments. Every lockup ships in English and Portuguese.</p>', visual: `<div class="tiles">${lockups}</div>` }),
      block(page, { title: 'Badges', html: '<p>Compact, self-contained marks for seals, stamps, labels and packaging details. Use them intentionally, in support of the main logo, never competing with it.</p>', visual: `<div class="tiles tiles--3">${badges}</div>` }),
      block(page, { title: 'Colorways', html: '<p>The five colorways supplied in the logo files. The approved logo-on-ground pairs are on the <a href="color.html#combinations">Color</a> page.</p>', visual: `<div class="tiles tiles--5">${colorways}</div>` }),
      block(page, { title: 'Logo Misuse', html: '<p>Never stretch, rotate, rearrange, recolor, shadow or blur the logo, or place it on a poor-contrast background.</p>', visual: `<figure class="page-figure"><img src="${pageImg(17)}" alt="Logo misuse examples from the original guidelines" width="1920" height="1080" loading="lazy"><figcaption>${pageLink(17, 'PDF p.17')}</figcaption></figure>` }),
      block(page, { title: 'Logo Rules', html: md(marks.tokens) + `<p class="downloads-inline"><a class="btn" href="downloads/Kestrel-Tea-Logos.zip" download>Download logo files (${zipMb} MB)</a></p>` }),
    ].join(''),
  });
}

// Color
{
  const page = PAGES[4];
  const core = sectionOf(brandDoc, 'Visual', 'Core Colors');
  const swatch = (c, tier) => {
    const fg = onColor(c.hex);
    return `<article class="swatch" style="--bg:${c.hex};--fg:${fg}">
  <header><h3>${esc(c.name)}</h3><span>→ ${esc(tier)}</span></header>
  <dl><div><dt>HEX</dt><dd><button type="button" data-copy="${c.hex}" aria-label="Copy ${esc(c.name)} ${c.hex}">${c.hex}</button></dd></div>
  <div><dt>RGB</dt><dd>${hexToRgb(c.hex).join(' / ')}</dd></div>
  <div><dt>CMYK</dt><dd>${esc(cmyk[c.name] ?? 'not supplied')}</dd></div>
  <div><dt>Token</dt><dd><code>${c.token}</code></dd></div></dl>
</article>`;
  };
  const tierBlocks = tiers.map((t) => block(page, {
    title: `${t.name === 'Secondary / accent' ? 'Secondary Colors' : `${t.name} Colors`}`,
    html: mdText(t.note.replace(/:\s*$/, '')) + `<ul class="color-notes">${t.colors.map((c) => `<li><b>${esc(c.name)}.</b> ${mdInline(c.desc || '')}</li>`).join('')}</ul>`,
    visual: `<div class="swatches">${t.colors.map((c) => swatch(c, t.name === 'Secondary / accent' ? 'Secondary | Accent' : `${t.name} Color`)).join('')}</div>`,
  })).join('');
  const pairs = Object.entries(tokens.components).filter(([, v]) => v.backgroundColor && v.textColor).map(([name, v]) => {
    const bg = resolve(v.backgroundColor), fg = resolve(v.textColor), ratio = contrast(bg, fg);
    const verdict = ratio >= 4.5 ? ['pass', 'AA all text'] : ratio >= 3 ? ['large', 'AA large text only'] : ['fail', 'Below AA'];
    return `<figure class="pair" style="background:${bg};color:${fg}"><span class="pair-sample">KESTREL TEA</span><figcaption><code>${name}</code><span class="ratio ratio--${verdict[0]}">${ratio.toFixed(2)}:1 · ${verdict[1]}</span></figcaption></figure>`;
  }).join('');
  const combosMd = designColorsMd.slice(designColorsMd.indexOf('**Combination rules.**'));
  pages[page.file] = layout(page, {
    lede: 'Built from "Harbour Colors": a palette sampled from the tiled facades and warehouse doors of the old river port.',
    toc: ['Origin', ...tiers.map((t) => (t.name === 'Secondary / accent' ? 'Secondary Colors' : `${t.name} Colors`)), 'Combinations'],
    body: [
      block(page, { title: 'Origin', html: md(core.tokens.slice(0, 1)) + `<p>${pageLink(19, 'Palette derivation, PDF p.19')} · ${pageLink(20, 'PDF p.20')}</p>`, visual: `<figure class="page-figure"><img src="${pageImg(19)}" alt="Harbour tiles and doors sampled into the palette" width="1920" height="1080" loading="lazy"></figure>` }),
      tierBlocks,
      block(page, { title: 'Combinations', id: 'combinations', html: mdText(combosMd) + '<p>Each pairing below is one the designer used. Contrast is computed against WCAG 2 thresholds.</p>', visual: `<div class="pairs">${pairs}</div>` }),
    ].join(''),
  });
}

// Typography
{
  const page = PAGES[5];
  const faces = sectionOf(brandDoc, 'Visual', 'Typefaces');
  const specimens = [
    ['Bricolage Grotesque', 800, 'BRICOLAGE', 'Packaging font and display voice. Ultrabold, all caps.', 28],
    ['Fraunces', 600, 'Fraunces', 'Headlines and prominent text.', 29],
    ['Instrument Sans', 300, 'Instrument Sans', 'Subheaders, body text and buttons.', 29],
  ].map(([family, weight, sample, role, p]) => `<figure class="specimen"><div class="specimen-art" style="font-family:'${family}';font-weight:${weight}">${sample}</div><figcaption><b>${family}</b> · ${role} ${pageLink(p, `PDF p.${p}`)}</figcaption></figure>`).join('');
  const SAMPLES = {
    'display-caps': 'TEA, TAKEN SLOWLY.',
    'label-caps': 'KESTREL SMOKED BLACK',
    'headline-lg': 'Single Estates, Blended in Porto',
    'headline-md': 'Pinewood Smoke in Every Cup.',
    'title-sm': 'Whole Leaf, Small Batch',
    'body-md': 'Rolled by hand and smoked over pine, so the leaf keeps its shape and the cup keeps its sweetness.',
    'label-cta': 'kestreltea.example',
  };
  const scale = Object.entries(tokens.typography).map(([name, t]) => {
    const r = typeRanges[name] ?? {};
    const caps = /caps/.test(name) ? 'text-transform:uppercase;' : '';
    return `<tr><th scope="row"><code>${name}</code><small>${esc(r.use ?? '')}</small></th><td>${esc(t.fontFamily)} ${t.fontWeight}<small>${esc(r.range ?? '')}</small></td><td><span class="type-sample" style="font-family:'${t.fontFamily}';font-weight:${t.fontWeight};font-size:${t.fontSize ?? '40px'};${caps}">${esc(SAMPLES[name] ?? 'Kestrel Tea')}</span></td></tr>`;
  }).join('');
  pages[page.file] = layout(page, {
    lede: 'Three families, each with a fixed job: Bricolage Grotesque for display, Fraunces for headlines, Instrument Sans for everything you read.',
    toc: ['Typefaces', 'Type Scale', 'Families & Licensing'],
    body: [
      block(page, { title: 'Typefaces', html: '<p>The brand fonts, set in their own faces.</p>', visual: `<div class="specimens">${specimens}</div>` }),
      block(page, { title: 'Type Scale', html: mdText(designTypeMd.replace(/^\|.*\|$\n?/gm, '')) + `<p>${pageLink(30, 'Typography hierarchy, PDF p.30')}</p>`, visual: `<div class="table-wrap"><table class="scale"><thead><tr><th>Token</th><th>Face · range</th><th>Sample (at range minimum)</th></tr></thead><tbody>${scale}</tbody></table></div>` }),
      block(page, { title: 'Families & Licensing', html: md(faces.tokens) }),
    ].join(''),
  });
}

// Brand assets, imagery and applications
{
  const page = PAGES[6];
  const art = sectionOf(brandDoc, 'Visual', 'Art Direction');
  const photo = sectionOf(brandDoc, 'Visual', 'Photography & Illustration');
  const groundColor = { 'Light BG': colorTokens['paper-white'], Saffron: colorTokens.saffron, Oxblood: colorTokens.oxblood, Sage: colorTokens.sage, 'Dark BG': colorTokens['pine-ink'] };
  const assetTiles = (kind) => assetGrounds.map((g) => tile({ src: assets[kind][g], alt: `Brand ${kind}, ${g}`, bg: groundColor[g], caption: `<b>${g}</b>`, cls: `tile--${kind}` })).join('');
  const gallery = (items, cls = '') => `<div class="gallery ${cls}">${items.map((i) => `<figure><a href="${i.src}"><img src="${i.src}" alt="${esc(i.label)}" width="${i.w}" height="${i.h}" loading="lazy"></a><figcaption>${esc(i.label)}</figcaption></figure>`).join('')}</div>`;
  pages[page.file] = layout(page, {
    lede: 'Tile geometry, rice-paper grain and one warm saffron note: never the cliché of traditional tea branding.',
    toc: ['Art Direction', 'Brand Pattern', 'Brand Element', 'Brand Texture', 'Photography', 'Social Media', 'Packaging', 'Brand in Action'],
    body: [
      block(page, { title: 'Art Direction', html: md(art.tokens) }),
      block(page, { title: 'Brand Pattern', html: `<p>Two interlocking tile quarters form the primary brand asset. A subtle color accent where they meet breaks the cliché of traditional tea branding. ${pageLink(33, 'PDF p.33')}</p>`, visual: `<div class="tiles tiles--5">${assetTiles('pattern')}</div>` }),
      block(page, { title: 'Brand Element', html: '<p>The graphic element paired with the logo in the "Logo with Asset" configuration, for packaging fronts and hero moments.</p>', visual: `<div class="tiles tiles--5">${assetTiles('element')}</div>` }),
      block(page, { title: 'Brand Texture', html: `<p>Drawn from the rice paper the founders wrap sample packets in: a soft, fibrous grain that adds warmth and tactility without visual noise. ${pageLink(32, 'PDF p.32')}</p>`, visual: `<div class="tiles tiles--5">${assetGrounds.map((g) => `<figure class="tile"><div class="tile-art tile-art--cover" style="background-image:url('${assets.texture[g]}')"></div><figcaption><b>${g}</b></figcaption></figure>`).join('')}</div>` }),
      block(page, { title: 'Photography', html: md(photo.tokens) }),
      block(page, { title: 'Social Media', html: `<p>Portrait posts on the brand grounds, with headline, small mark and URL. ${pageLink(37, 'PDF p.37')} · ${pageLink(38, 'PDF p.38')}</p>`, visual: gallery(POSTS, 'gallery--4') }),
      block(page, { title: 'Packaging', html: '<p>Standard tins in the three tea colorways, and the three-tin gift box. Private-label tins are in the source folder; see Governance → Open Items before printing them.</p>', visual: gallery(PACKAGING, 'gallery--3') }),
      block(page, { title: 'Brand in Action', html: `<p>Mockups supplied with the identity. They show placeholder names, numbers and prices that are not real; never reuse them. ${pageLink(40, 'PDF p.40–49')}</p>`, visual: gallery(MOCKUPS, 'gallery--2') }),
    ].join(''),
  });
}

// Design system
{
  const page = PAGES[7];
  const sec = (t) => designDoc.chapters.find((c) => c.title === t);
  const colorRows = Object.entries(tokens.colors).map(([k, v]) => `<tr><th scope="row"><code>${k}</code></th><td><span class="chip" style="background:${resolve(v)}"></span>${esc(resolve(v))}</td><td>${typeof v === 'string' && v.startsWith('{') ? `alias of <code>${esc(v)}</code>` : ''}</td></tr>`).join('');
  const typeRows = Object.entries(tokens.typography).map(([k, t]) => `<tr><th scope="row"><code>${k}</code></th><td>${esc(t.fontFamily)}</td><td>${t.fontWeight}</td><td>${esc(t.fontSize ?? '—')}</td></tr>`).join('');
  const compRows = Object.entries(tokens.components).map(([k, c]) => `<tr><th scope="row"><code>${k}</code></th><td>${Object.entries(c).map(([p, v]) => `${p}: <code>${esc(v)}</code>`).join('<br>')}</td></tr>`).join('');
  const lintList = lint.findings.filter((f) => f.severity === 'warning').map((f) => `<li><code>${esc(f.path ?? f.rule)}</code>: ${esc(f.message)}</li>`).join('');
  const btn = tokens.components['button-cta'];
  const cta = `<div class="ds-demo"><a class="btn" style="background:${resolve(btn.backgroundColor)};color:${resolve(btn.textColor)}">kestreltea.example</a></div>`;
  pages[page.file] = layout(page, {
    lede: 'The operational system on top of the brand: tokens, combinations and rules, validated by the DESIGN.md linter on every build.',
    toc: ['Overview', 'Files', 'Color Tokens', 'Type Tokens', 'Components', 'Layout', 'Elevation & Depth', 'Shapes', "Do's and Don'ts", 'Validation'],
    body: [
      block(page, { title: 'Overview', html: md(sec('Overview').tokens) + md(designDoc.preface) }),
      block(page, { title: 'Files', html: '<p>Use these files in code and design tools. They are generated from DESIGN.md on every build.</p>', visual: `<ul class="files">
        <li><a href="DESIGN.md"><strong>DESIGN.md</strong><small>Source of truth for visual values</small></a></li>
        <li><a href="tokens.json"><strong>tokens.json</strong><small>W3C Design Tokens 2025.10 (Figma token plugins, Style Dictionary)</small></a></li>
        <li><a href="tailwind-theme.css"><strong>tailwind-theme.css</strong><small>Tailwind CSS v4 @theme</small></a></li></ul>` }),
      block(page, { title: 'Color Tokens', html: '<p><code>primary</code> is an alias of Ember Red. Full meanings and tiers are on the <a href="color.html">Color</a> page.</p>', visual: `<div class="table-wrap"><table><thead><tr><th>Token</th><th>Value</th><th>Note</th></tr></thead><tbody>${colorRows}</tbody></table></div>` }),
      block(page, { title: 'Type Tokens', html: '<p>Sizes are the minimum of each range set by the designer. See <a href="typography.html#type-scale">Typography</a> for the ranges.</p>', visual: `<div class="table-wrap"><table><thead><tr><th>Token</th><th>Family</th><th>Weight</th><th>Size</th></tr></thead><tbody>${typeRows}</tbody></table></div>` }),
      block(page, { title: 'Components', html: md(sec('Components').tokens), visual: cta + `<div class="table-wrap"><table><thead><tr><th>Component</th><th>Properties</th></tr></thead><tbody>${compRows}</tbody></table></div>` }),
      block(page, { title: 'Layout', html: md(sec('Layout').tokens) }),
      block(page, { title: 'Elevation & Depth', html: md(sec('Elevation & Depth').tokens) }),
      block(page, { title: 'Shapes', html: md(sec('Shapes').tokens) }),
      block(page, { title: "Do's and Don'ts", html: md(sec("Do's and Don'ts").tokens) }),
      block(page, { title: 'Validation', html: `<p>This build ran <code>design.md lint</code>: <b>${lint.summary.errors} errors, ${lint.summary.warnings} warnings</b>. Warnings are real findings about the designer's own pairings, kept as designed and flagged for review:</p><ul>${lintList}</ul>` }),
    ].join(''),
  });
}

// Governance
{
  const page = PAGES[8];
  const gov = chapterOf(brandDoc, 'Governance');
  const open = chapterOf(brandDoc, 'Open Items');
  pages[page.file] = layout(page, {
    lede: 'What the brand may say, how new things are named, and what still needs a decision.',
    toc: [...gov.sections.map((s) => s.title), 'Open Items'],
    body: sectionsToBlocks(page, gov.sections) + block(page, { title: 'Open Items', html: md(open.tokens) + open.sections.map((s) => `<h3>${esc(s.title)}</h3>${md(s.tokens)}`).join('') }),
  });
}

// How to use (written for this site; not in the source files)
{
  const page = PAGES[9];
  const prompt = (id, text) => `<div class="prompt"><pre id="${id}">${esc(text)}</pre><button type="button" class="btn btn--ghost" data-copy-from="${id}">Copy</button></div>`;
  pages[page.file] = layout(page, {
    lede: 'How people and AI tools should use these guidelines, and how to keep them up to date.',
    toc: ['For People', 'For AI Agents', 'Claude & ChatGPT', 'Claude Code & Coding Agents', 'Design Tools & Code', 'Prompt Library', 'Updating the Guidelines'],
    body: [
      block(page, { title: 'For People', html: `<ol>
<li><b>Start with the voice.</b> Read <a href="voice.html">Voice</a> before writing anything. The rules are short and specific.</li>
<li><b>Use supplied artwork only.</b> Download logos from the <a href="logo.html">Logo</a> page. Never redraw, retype or recolor the mark.</li>
<li><b>Copy exact values.</b> Click any HEX on the <a href="color.html">Color</a> page to copy it. Use the CMYK values only after a print proof.</li>
<li><b>Check claims before you publish.</b> Words like "pure", "raw", "traceable" and "single-origin" need evidence. See <a href="governance.html#claims">Claims</a>.</li>
<li><b>When the guide is silent, ask.</b> Items marked <span class="src src--proposal">proposal</span> are not yet approved.</li></ol>` }),
      block(page, { title: 'For AI Agents', id: 'for-ai-agents', html: `<p>The brand is published as two plain-text files that agents can read directly:</p>
<ul><li><a href="BRAND.md"><code>BRAND.md</code></a> (<a href="https://thebrand.md/">BRAND.md spec</a> 0.3.0) is authoritative for meaning, voice, terminology and claims.</li>
<li><a href="DESIGN.md"><code>DESIGN.md</code></a> (<a href="https://github.com/google-labs-code/design.md">Google DESIGN.md format</a>) is authoritative for concrete visual values.</li></ul>
<p><b>Reading order for agents:</b> frontmatter → Strategy → Voice › Tonal Rules (treat as instructions) → Phrases and Vocabulary (as examples) → Governance › Claims (before stating any fact) → Visual and DESIGN.md (for anything visual).</p>
<p><b>Markers:</b> <span class="src src--pdf">PDF p.N</span> stated in the original guidelines · <span class="src src--artwork">artwork</span> observed in production files · <span class="src src--proposal">proposal</span> not yet approved. Never treat a proposal as policy, and never resolve an Open Item silently.</p>
<p class="ai-actions"><a class="btn" data-ai="claude" href="https://claude.ai/new">Open in Claude ↗</a> <a class="btn btn--ghost" data-ai="chatgpt" href="https://chatgpt.com/">Open in ChatGPT ↗</a></p>` }),
      block(page, { title: 'Claude & ChatGPT', html: `<p><b>Quick question:</b> use the Open in Claude / ChatGPT buttons. They start a chat that reads the files from this site.</p>
<p><b>Ongoing work:</b> create a Project (Claude) or Project / custom GPT (ChatGPT), and add <a href="BRAND.md" download>BRAND.md</a> and <a href="DESIGN.md" download>DESIGN.md</a> as project files. Then paste this into the project instructions:</p>
${prompt('p-project', 'You write and design for Kestrel Tea, a small-batch tea brand from Porto. BRAND.md and DESIGN.md in this project are the source of truth. Follow Voice > Tonal Rules for all writing. Use only approved colors, typefaces and logo files. Before stating any fact about the product (purity, origin, process, partners), check Governance > Claims; if a claim is not approved, mark it as a draft. Never treat items marked (proposal) as approved, and point out conflicts instead of resolving them.')}` }),
      block(page, { title: 'Claude Code & Coding Agents', html: `<p>For a website, app or any repository built for Kestrel Tea, put both files in the repository root, then point your agent's instruction file at them.</p>
${prompt('p-repo', 'curl -O ' + (SITE_URL || 'https://YOUR-SITE') + '/BRAND.md\ncurl -O ' + (SITE_URL || 'https://YOUR-SITE') + '/DESIGN.md')}
<p>Add this to <code>CLAUDE.md</code> (Claude Code) or <code>AGENTS.md</code> (Codex, Cursor and others):</p>
${prompt('p-claudemd', '## Brand\nThis project follows BRAND.md (voice, claims, approved identity) and DESIGN.md (tokens, type scale, components). Read both before writing UI copy or styles. Use DESIGN.md tokens instead of hard-coded colors. Check BRAND.md > Governance > Claims before writing product claims. Run `npx @google/design.md lint DESIGN.md` after changing it.')}` }),
      block(page, { title: 'Design Tools & Code', html: `<ul>
<li><b>Figma:</b> import <a href="tokens.json">tokens.json</a> with a design-token plugin that reads the W3C Design Tokens format, to create variables for every brand color.</li>
<li><b>Tailwind CSS v4:</b> import <a href="tailwind-theme.css">tailwind-theme.css</a> to get the brand colors and type as theme values.</li>
<li><b>Other code:</b> <a href="tokens.json">tokens.json</a> works with Style Dictionary and similar token pipelines.</li>
<li><b>Fonts:</b> install from <code>1 - Source Files/3 - Brand Fonts</code> after confirming the licenses (Open Item 10).</li></ul>` }),
      block(page, { title: 'Prompt Library', html: `<p>Starting points that keep agents inside the brand.</p>
<h3>Packaging or product copy</h3>${prompt('p-copy', 'Using BRAND.md, write front-of-pack copy for Kestrel Tea Smoked Black (Preto Fumado), 50 g tin. Follow the Tonal Rules, use the product names exactly as in Vocabulary, and list every claim you used with its status from Governance > Claims.')}
<h3>Social post</h3>${prompt('p-social', 'Using BRAND.md and DESIGN.md, draft three Instagram captions and a matching 4:5 post layout for Kestrel Tea Golden Oolong. Use phrases from Voice > Phrases where they fit, one of the approved post grounds, and Bricolage Grotesque for the headline. No unapproved claims.')}
<h3>Brand review</h3>${prompt('p-review', 'Review the attached draft against BRAND.md and DESIGN.md. List: (1) tone-rule violations, quoting the rule; (2) colors, fonts or logo uses not in DESIGN.md; (3) every claim and its status in Governance > Claims; (4) anything that conflicts with an Open Item. Suggest fixes in the brand voice.')}` }),
      block(page, { title: 'Updating the Guidelines', html: `<ol>
<li>Edit <code>BRAND.md</code> or <code>DESIGN.md</code> in the brand library. Never edit the website pages directly.</li>
<li>Bump <code>version</code> in BRAND.md's frontmatter when the identity changes.</li>
<li>Rebuild: <code>npm run build</code> in <code>6 - Brand Website</code>. The build stops if DESIGN.md fails the linter, or if a color in the prose disagrees with its token.</li>
<li>Deploy the <code>dist</code> folder to any static host.</li>
<li>When an Open Item is resolved, update the file, remove the item, and rebuild.</li></ol>` }),
    ].join(''),
  });
}

// Original PDF pages
{
  const page = PAGES[10];
  const thumbs = Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => `<figure><a href="${pageImg(n)}"><img src="${pageImg(n)}" alt="Original guidelines page ${n}" loading="lazy" width="1920" height="1080"></a><figcaption>p.${n}</figcaption></figure>`).join('');
  pages[page.file] = layout(page, {
    lede: 'The designer\'s document, page by page. Every “PDF p.N” reference on this site links here.',
    toc: ['All Pages'],
    body: block(page, { title: 'All Pages', html: `<p>Kestrel Tea Brand Guidelines, designed by Northfold Studio™, January 2026. <a href="downloads/Kestrel-Tea-Brand-Guidelines.pdf" download>Download the PDF</a>.</p>`, visual: `<div class="gallery gallery--pages">${thumbs}</div>` }),
  });
}

for (const [file, html] of Object.entries(pages)) fs.writeFileSync(out(file), html);

// ---------------------------------------------------------------------------
// 8. Agent-facing index files.

const abs = (p) => (SITE_URL ? `${SITE_URL}/${p}` : p);
fs.writeFileSync(out('llms.txt'), `# Kestrel Tea Brand Guidelines

> Brand identity and design system for Kestrel Tea™, a small-batch tea brand (Kestrel Tea Co., Porto). Identity by Northfold Studio, January 2026. Read BRAND.md for strategy, voice, terminology and claims, and DESIGN.md for exact visual values. Items marked (proposal) are not approved; check Claims before stating facts.

## Source files
- [BRAND.md](${abs('BRAND.md')}): brand strategy, voice, approved identity, naming, claims and open items (BRAND.md spec 0.3.0)
- [DESIGN.md](${abs('DESIGN.md')}): design tokens, color combinations, type scale, components (Google DESIGN.md format)
- [tokens.json](${abs('tokens.json')}): W3C Design Tokens 2025.10 export
- [tailwind-theme.css](${abs('tailwind-theme.css')}): Tailwind CSS v4 theme export

## Pages
${PAGES.map((p) => `- [${p.title}](${abs(p.file)})`).join('\n')}

## Downloads
- [Logo files (SVG + PNG)](${abs('downloads/Kestrel-Tea-Logos.zip')})
- [Original guidelines PDF](${abs('downloads/Kestrel-Tea-Brand-Guidelines.pdf')})
`);
fs.writeFileSync(out('robots.txt'), `User-agent: *\nAllow: /\n${SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : ''}`);
if (SITE_URL) {
  fs.writeFileSync(out('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.map((p) => `  <url><loc>${SITE_URL}/${p.file === 'index.html' ? '' : p.file}</loc></url>`).join('\n')}\n</urlset>\n`);
}
fs.writeFileSync(out('ai-prompt.txt'), AI_PROMPT);

const size = run('du', ['-sh', DIST]).split('\t')[0];
console.log(`Built ${Object.keys(pages).length} pages into dist (${size}). Lint: ${lint.summary.errors} errors, ${lint.summary.warnings} warnings.${EMBED_FONTS ? ' Fonts embedded.' : ' Fonts NOT embedded.'}${SITE_URL ? '' : ' SITE_URL not set: links in llms.txt are relative.'}`);
