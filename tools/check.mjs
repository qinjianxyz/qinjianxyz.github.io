#!/usr/bin/env node
// Dependency-free static gate. Does not build, serve, fetch, or modify the site.
import { readFile, stat, realpath } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const origin = 'https://qinjianxyz.github.io';
const baseline = '101471de6c7355a376334e61f578c31a627193f9';
const errors = [];
const warnings = [];
const documents = new Map();
const files = new Map();
let references = 0;
let exactParagraphs = 0;
let exactTranslationParagraphs = 0;
let exactPoemLines = 0;
let verifiedOriginalImages = 0;
const fail = (file, message) => errors.push(`${file}: ${message}`);
const warn = (file, message) => warnings.push(`${file}: ${message}`);
const decode = value => String(value).replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity) => {
  if (entity[0] === '#') {
    const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : whole;
  }
  return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'})[entity.toLowerCase()] ?? whole;
});
const textContent = value => decode(value.replace(/<[^>]*>/g, ''));
const normalizedText = value => textContent(value).replace(/\s+/g, ' ').trim();
function attributes(source) {
  const attrs = new Map();
  const input = source.replace(/^<\/?[\w:-]+/, '').replace(/\/?\s*>$/, '');
  const re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const m of input.matchAll(re)) attrs.set(m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4] ?? ''));
  return attrs;
}
function parse(html) {
  // The generated static markup is deliberately simple. Ignore comments and
  // raw script/style bodies so source examples cannot masquerade as HTML tags.
  const markup = html.replace(/<!--[\s\S]*?-->/g, '').replace(/(<(?:script|style)\b[^>]*>)[\s\S]*?(<\/(?:script|style)\s*>)/gi, '$1$2');
  const tags = [...markup.matchAll(/<([a-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)].map(m => ({name:m[1].toLowerCase(), attrs:attributes(m[0])}));
  const ids = tags.filter(t => t.attrs.has('id')).map(t => t.attrs.get('id'));
  return {html, tags, ids, idSet:new Set(ids)};
}
function classContents(html, className) {
  const result = [];
  const open = /<([a-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
  for (const match of html.matchAll(open)) {
    const attrs = attributes(match[0]);
    if (!(attrs.get('class') ?? '').split(/\s+/).includes(className)) continue;
    const name = match[1].toLowerCase();
    const pairs = new RegExp(`<(/?)${name}\\b(?:"[^"]*"|'[^']*'|[^'">])*>`, 'gi');
    pairs.lastIndex = match.index + match[0].length;
    let depth = 1;
    for (let next; (next = pairs.exec(html));) {
      depth += next[1] ? -1 : 1;
      if (!depth) {
        result.push({name, attrs, inner:html.slice(match.index + match[0].length, next.index)});
        break;
      }
    }
  }
  return result;
}
function bilingual(file, value, field) {
  if (!value || typeof value !== 'object' || ['zh','en'].some(l => typeof value[l] !== 'string' || !value[l].trim())) {
    fail(file, `${field} requires nonempty zh and en text`);
    return false;
  }
  return true;
}
async function bytes(file) {
  if (!files.has(file)) files.set(file, readFile(resolve(root, file)));
  return files.get(file);
}
async function document(file) {
  if (!documents.has(file)) documents.set(file, bytes(file).then(b => parse(b.toString('utf8'))));
  return documents.get(file);
}
const route = file => '/' + file.replace(/(?:^|\/)index\.html$/, m => m.startsWith('/') ? '/' : '');
function localURL(value, from) {
  let url;
  try { url = new URL(value, origin + route(from)); }
  catch { fail(from, 'malformed URL in a reference'); return null; }
  if (url.origin !== origin) return null;
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch { fail(from, 'invalid percent encoding in local reference'); return null; }
  if (pathname.includes('\0') || pathname.includes('\\')) { fail(from, 'invalid local reference path'); return null; }
  const file = pathname.replace(/^\/+/, '') + (pathname.endsWith('/') ? 'index.html' : '');
  const full = resolve(root, file);
  if (full !== root && !full.startsWith(root + sep)) { fail(from, 'local reference escapes site root'); return null; }
  return {file, full, hash:url.hash, url};
}
async function reference(value, from) {
  if (!value.trim()) { fail(from, 'empty href/src reference'); return; }
  const target = localURL(value, from);
  if (!target) return;
  references++;
  try {
    const actual = await realpath(target.full);
    if (!actual.startsWith(root + sep)) { fail(from, 'local reference resolves outside site root'); return; }
    if (!(await stat(actual)).isFile()) { fail(from, `reference is not a file: ${value}`); return; }
  } catch { fail(from, `missing local reference: ${value}`); return; }
  if (target.hash && /\.html?$/i.test(target.file)) {
    let id;
    try { id = decodeURIComponent(target.hash.slice(1)); }
    catch { fail(from, 'invalid percent encoding in fragment'); return; }
    // Text fragments are browser directives, not DOM IDs.
    id = id.split(':~:text=')[0];
    if (id && !(await document(target.file)).idSet.has(id)) fail(from, `missing anchor: ${value}`);
  }
}
function requireOne(file, tags, description) {
  if (tags.length !== 1) fail(file, `expected one ${description}; found ${tags.length}`);
  return tags[0];
}
function contentScan(file, content) {
  // Report only the category, never a matching potential credential value.
  const forbidden = [
    ['private filesystem path', /(?:\/Users\/|\/home\/|[A-Z]:\\Users\\|file:\/\/|~\/Documents\/)/i],
    ['local development URL', /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/i],
    ['private key material', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
    ['credential-shaped token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-(?:proj-)?[A-Za-z0-9_-]{32,}|AKIA[A-Z0-9]{16})\b/],
    ['credential assignment', /\b(?:OPENAI_API_KEY|GITHUB_TOKEN|AWS_SECRET_ACCESS_KEY)\s*[=:]\s*["']?[^\s"'<]{8,}/],
    ['unfinished placeholder copy', /\b(?:lorem ipsum|TODO|FIXME|TBD|coming soon|your (?:project|name) here|insert (?:copy|text) here)\b|待填充|占位文案|这里填写/i],
  ];
  for (const [label, pattern] of forbidden) if (pattern.test(content)) fail(file, label);
}

let articles;
try { articles = JSON.parse((await bytes('_portfolio/articles.json')).toString('utf8')); }
catch { console.error('FAIL _portfolio/articles.json: missing or invalid JSON'); process.exit(1); }
if (!Array.isArray(articles) || !articles.length) {
  console.error('FAIL _portfolio/articles.json: expected at least one reviewed source article');
  process.exit(1);
}
const slugs = new Set();
for (const article of articles) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug) || slugs.has(article.slug)) fail('_portfolio/articles.json', 'invalid or duplicate article slug');
  slugs.add(article.slug);
  if (!Array.isArray(article.paragraphs) || !article.paragraphs.length || article.paragraphs.some(p => typeof p !== 'string' || !p.trim())) fail('_portfolio/articles.json', 'article paragraphs must be nonempty strings');
  if (!/^https:\/\/x\.com\/rayq_ai\/status\/\d+$/.test(article.sourceUrl ?? '')) fail('_portfolio/articles.json', 'article source must identify Ray’s original X post');
  if (!Number.isFinite(Date.parse(article.publishedAt))) fail('_portfolio/articles.json', 'invalid publication timestamp');
  bilingual('_portfolio/articles.json', article.summary, `${article.slug} summary`);
  const translated = article.translations?.zh?.paragraphs;
  if (!Array.isArray(translated) || !translated.length || translated.some(p => typeof p !== 'string' || !p.trim())) {
    fail('_portfolio/articles.json', `${article.slug} needs complete Chinese reading-translation paragraphs`);
  }
}
let artworks;
try { artworks = JSON.parse((await bytes('_portfolio/artworks.json')).toString('utf8')); }
catch { console.error('FAIL _portfolio/artworks.json: missing or invalid JSON'); process.exit(1); }
const requiredArtSlugs = new Set(['snow-upon-the-bow-and-blade','a-star-within-the-sleeve','when-the-world-turns-white','ninety-thousand-li','three-blessings-one-peach-tree']);
if (!Array.isArray(artworks) || artworks.length !== requiredArtSlugs.size) {
  console.error('FAIL _portfolio/artworks.json: expected the five supplied artworks');
  process.exit(1);
}
const artSlugs = new Set();
for (const work of artworks) {
  const label = `_portfolio/artworks.json (${work.slug ?? 'missing slug'})`;
  if (!requiredArtSlugs.has(work.slug) || artSlugs.has(work.slug)) fail(label, 'unexpected or duplicate artwork slug');
  artSlugs.add(work.slug);
  for (const field of ['title','alt','summary','author','sourceTitle','background','interpretation']) bilingual(label, work[field], field);
  for (const field of ['poemLines','translationLines']) {
    if (!Array.isArray(work[field]) || !work[field].length || work[field].some(line => typeof line !== 'string' || !line.trim())) fail(label, `${field} must contain nonempty lines`);
  }
  if (typeof work.originalWork !== 'boolean') fail(label, 'originalWork must explicitly distinguish original and historical text');
  if (!work.image || !/^[a-f0-9]{64}$/.test(work.image.sha256 ?? '')) fail(label, 'original PNG requires a SHA-256');
  if (!Number.isInteger(work.image?.width) || !Number.isInteger(work.image?.height) || work.image.width <= 0 || work.image.height <= 0) fail(label, 'original image dimensions must be positive integers');
  for (const field of ['src','thumb']) {
    const asset = work.image?.[field];
    if (typeof asset !== 'string' || !asset.startsWith('/media/')) fail(label, `image.${field} must identify a local media asset`);
    else await reference(asset, '_portfolio/artworks.json');
  }
  if (typeof work.image?.src === 'string' && work.image.src.startsWith('/media/')) {
    try {
      const data = await bytes(work.image.src.slice(1));
      if (!data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || data.toString('ascii',12,16) !== 'IHDR') fail(label, 'original source is not a PNG with IHDR');
      else if (data.readUInt32BE(16) !== work.image.width || data.readUInt32BE(20) !== work.image.height) fail(label, 'original PNG dimensions differ from metadata');
      if (createHash('sha256').update(data).digest('hex') !== work.image.sha256) fail(label, 'original PNG bytes differ from recorded SHA-256');
      else verifiedOriginalImages++;
    } catch { fail(label, 'unable to verify original PNG'); }
  }
  if (work.sourceLinks !== undefined && (!Array.isArray(work.sourceLinks) || work.sourceLinks.some(link => !link || typeof link.label !== 'string' || !link.label.trim() || typeof link.url !== 'string' || !/^https:\/\//.test(link.url)))) fail(label, 'sourceLinks require labels and HTTPS source URLs');
}
const basePages = ['index.html', 'work.html', 'writing.html', 'about.html', 'art.html',
  ...articles.map(a => `writing/${a.slug}.html`), ...artworks.map(a => `art/${a.slug}.html`)];
const pages = basePages.flatMap(file => [file, `zh/${file}`]);

for (const file of pages) {
  let doc;
  try { doc = await document(file); }
  catch { fail(file, 'missing generated page'); continue; }
  contentScan(file, doc.html);
  if (!/^<!doctype html>/i.test(doc.html.trimStart())) fail(file, 'missing HTML5 doctype');
  requireOne(file, doc.tags.filter(t => t.name === 'h1'), 'h1');
  requireOne(file, doc.tags.filter(t => t.name === 'main'), 'main landmark');
  if (!doc.idSet.has('main')) fail(file, 'missing main skip-link target');
  if (doc.ids.some(id => !id)) fail(file, 'empty id');
  for (const id of doc.idSet) if (doc.ids.filter(x => x === id).length > 1) fail(file, `duplicate id: ${id}`);
  const htmlTag = requireOne(file, doc.tags.filter(t => t.name === 'html'), 'html element');
  const expectedLanguage = file.startsWith('zh/') ? 'zh-CN' : 'en';
  if (htmlTag?.attrs.get('lang') !== expectedLanguage) fail(file, `html lang should be ${expectedLanguage}`);
  const head = doc.html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  if (!head) { fail(file, 'missing head'); continue; }
  const headTags = parse(head).tags;
  const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if (titles.length !== 1 || !textContent(titles[0]?.[1] ?? '').trim()) fail(file, 'expected one nonempty title');
  for (const name of ['description', 'viewport', 'twitter:card']) {
    const tag = requireOne(file, headTags.filter(t => t.name === 'meta' && t.attrs.get('name') === name), `meta ${name}`);
    if (tag && !tag.attrs.get('content')?.trim()) fail(file, `empty meta ${name}`);
  }
  for (const property of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image']) {
    const tag = requireOne(file, headTags.filter(t => t.name === 'meta' && t.attrs.get('property') === property), `meta ${property}`);
    if (tag && !tag.attrs.get('content')?.trim()) fail(file, `empty meta ${property}`);
    if (tag && ['og:url','og:image'].includes(property)) await reference(tag.attrs.get('content') ?? '', file);
    if (property === 'og:url' && tag?.attrs.get('content') !== origin + route(file)) fail(file, 'og:url does not identify this page');
  }
  const canonical = requireOne(file, headTags.filter(t => t.name === 'link' && t.attrs.get('rel') === 'canonical'), 'canonical link');
  if (canonical?.attrs.get('href') !== origin + route(file)) fail(file, 'canonical URL does not identify this page');
  for (const language of ['zh-CN', 'en', 'x-default']) {
    const link = requireOne(file, headTags.filter(t => t.name === 'link' && t.attrs.get('rel') === 'alternate' && t.attrs.get('hreflang') === language), `hreflang ${language}`);
    const bare = file.replace(/^zh\//, '');
    const expected = origin + route((language === 'zh-CN' ? 'zh/' : '') + bare);
    if (link?.attrs.get('href') !== expected) fail(file, `incorrect hreflang ${language} target`);
  }
  const linkedData = [...head.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!linkedData.length) fail(file, 'missing JSON-LD');
  for (const block of linkedData) try { JSON.parse(block[1]); } catch { fail(file, 'invalid JSON-LD'); }
  for (const tag of doc.tags) {
    for (const key of ['href','src','data-image']) if (tag.attrs.has(key)) await reference(tag.attrs.get(key), file);
    if (tag.attrs.has('srcset')) for (const entry of tag.attrs.get('srcset').split(',')) await reference(entry.trim().split(/\s+/)[0], file);
    if (tag.name === 'img' && !tag.attrs.has('alt')) fail(file, 'image lacks alt attribute');
    for (const attribute of ['aria-controls','aria-labelledby','aria-describedby']) {
      if (tag.attrs.has(attribute)) for (const id of tag.attrs.get(attribute).split(/\s+/)) if (!doc.idSet.has(id)) fail(file, `${attribute} references absent id: ${id}`);
    }
  }
  const languageLink = requireOne(file, doc.tags.filter(t => t.name === 'a' && (t.attrs.get('class') ?? '').split(/\s+/).includes('language-link')), 'visible language switch');
  if (languageLink) {
    const expectedFile = file.startsWith('zh/') ? file.slice(3) : `zh/${file}`;
    const target = localURL(languageLink.attrs.get('href') ?? '', file);
    if (target?.file !== expectedFile) fail(file, 'language switch does not lead to the counterpart page');
    else try {
      const other = await document(expectedFile);
      const back = other.tags.find(t => t.name === 'a' && (t.attrs.get('class') ?? '').split(/\s+/).includes('language-link'));
      if (!back || localURL(back.attrs.get('href') ?? '', expectedFile)?.file !== file) fail(file, 'language switch is not reciprocal');
    } catch { fail(file, 'language counterpart is missing'); }
  }
  for (const menu of classContents(doc.html, 'mobile-menu')) {
    if (parse(menu.inner).tags.some(t => (t.attrs.get('class') ?? '').split(/\s+/).includes('language-link'))) fail(file, 'language switch must stay outside the collapsed mobile menu');
  }
  const artIndex = `${file.startsWith('zh/') ? '/zh/' : '/'}art.html`;
  if (!doc.tags.some(t => t.name === 'a' && t.attrs.get('href') === artIndex)) fail(file, 'missing art-overview entrance in this interface language');
  const htmlBudget = /(?:^|\/)writing\/[^/]+\.html$/.test(file) ? 192 * 1024 : 96 * 1024;
  if (Buffer.byteLength(doc.html) > htmlBudget) fail(file, `HTML exceeds ${htmlBudget / 1024} KiB page budget`);
}

for (const file of basePages) {
  const alias = `en/${file}`;
  try {
    const doc = await document(alias);
    const canonical = doc.tags.find(t => t.name === 'link' && t.attrs.get('rel') === 'canonical');
    if (canonical?.attrs.get('href') !== origin + route(file)) fail(alias, 'legacy English URL must point to its new canonical page');
    if (!doc.tags.some(t => t.name === 'a' && t.attrs.get('href') === route(file))) fail(alias, 'legacy URL needs a working fallback link');
    if (!doc.tags.some(t => t.name === 'meta' && t.attrs.get('name') === 'robots' && t.attrs.get('content') === 'noindex')) fail(alias, 'legacy redirect must not duplicate the canonical search entry');
    if (!doc.html.includes('location.search + location.hash')) fail(alias, 'legacy redirect must retain query and reading position');
  } catch { fail(alias, 'missing legacy English redirect'); }
}

for (const article of articles) {
  if (!Array.isArray(article.paragraphs)) continue;
  for (const prefix of ['', 'zh/']) {
    const file = `${prefix}writing/${article.slug}.html`;
    let doc;
    try { doc = await document(file); } catch { continue; }
    const paragraphs = [...doc.html.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)].map(m => ({attrs:attributes(`<p${m[1]}>`), text:textContent(m[2])}));
    for (const [i, expected] of article.paragraphs.entries()) {
      const actual = paragraphs.filter(p => p.attrs.get('id') === `p${i+1}`);
      if (actual.length !== 1 || actual[0].text !== expected) fail(file, `original paragraph p${i+1} differs from reviewed JSON`);
      else exactParagraphs++;
    }
    const anchored = paragraphs.filter(p => /^p\d+$/.test(p.attrs.get('id') ?? ''));
    if (anchored.length !== article.paragraphs.length) fail(file, 'original paragraph count differs from reviewed JSON');
    if (!doc.tags.some(t => t.name === 'a' && t.attrs.get('href') === article.sourceUrl)) fail(file, 'missing original X source link');
    if (!doc.tags.some(t => t.name === 'time' && t.attrs.get('datetime') === article.publishedAt)) fail(file, 'publication time differs from reviewed JSON');
    if (prefix === 'zh/') {
      const translation = classContents(doc.html, 'essay-translation');
      if (translation.length !== 1) fail(file, 'expected one Chinese essay-translation region');
      const original = classContents(doc.html, 'essay-original');
      if (original.length !== 1) fail(file, 'expected one separately identified English essay-original region');
      const label = normalizedText(doc.html);
      if (!/(?:AI\s*辅助|AI-assisted)/i.test(label) || !/(?:中文译文|Chinese translation)/i.test(label)) fail(file, 'Chinese translation needs an explicit AI-assisted translation label');
      const translated = article.translations?.zh?.paragraphs;
      if (Array.isArray(translated)) {
        for (const [i, expected] of translated.entries()) {
          const actual = paragraphs.filter(p => p.attrs.get('id') === `t${i+1}`);
          if (actual.length !== 1 || actual[0].text !== expected) fail(file, `Chinese translation paragraph t${i+1} differs from reviewed JSON`);
          else exactTranslationParagraphs++;
        }
        if (paragraphs.filter(p => /^t\d+$/.test(p.attrs.get('id') ?? '')).length !== translated.length) fail(file, 'Chinese translation paragraph count differs from JSON');
        if (translation.length === 1 && !translated.every((_,i) => new RegExp(`\\bid=["']t${i+1}["']`).test(translation[0].inner))) fail(file, 'translated paragraphs must belong to essay-translation');
      }
      if (original.length === 1 && !article.paragraphs.every((_,i) => new RegExp(`\\bid=["']p${i+1}["']`).test(original[0].inner))) fail(file, 'original paragraphs must remain in essay-original');
      if (!doc.tags.some(t => t.name === 'details')) fail(file, 'Chinese reading page must retain an expandable original');
    }
  }
}

for (const prefix of ['', 'zh/']) {
  const overview = `${prefix}art.html`;
  let index;
  try { index = await document(overview); } catch { continue; }
  for (const work of artworks) {
    const detailURL = `/${prefix}art/${work.slug}.html`;
    if (!index.tags.some(t => t.name === 'a' && t.attrs.get('href') === detailURL)) fail(overview, `missing overview entrance for ${work.slug}`);
    if (!index.tags.some(t => t.name === 'img' && t.attrs.get('src') === work.image?.thumb)) fail(overview, `missing thumbnail for ${work.slug}`);
    const file = `${prefix}art/${work.slug}.html`;
    let doc;
    try { doc = await document(file); } catch { continue; }
    const language = prefix ? 'zh' : 'en';
    const originals = classContents(doc.html, 'poem-original');
    if (originals.length !== 1) fail(file, 'expected one separately identified Chinese poem-original');
    else if (Array.isArray(work.poemLines)) {
      const lines = [...originals[0].inner.matchAll(/<([a-z][\w:-]*)\b([^>]*\bdata-poem-line\s*=\s*["']\d+["'][^>]*)>([\s\S]*?)<\/\1>/gi)]
        .map(m => ({attrs:attributes(`<${m[1]}${m[2]}>`), text:textContent(m[3])}));
      for (const [i, expected] of work.poemLines.entries()) {
        const actual = lines.filter(line => line.attrs.get('data-poem-line') === String(i+1));
        if (actual.length !== 1 || actual[0].text !== expected) fail(file, `poem line ${i+1} differs from supplied text`);
        else exactPoemLines++;
      }
      if (lines.length !== work.poemLines.length) fail(file, 'poem line count differs from supplied text');
      if (originals[0].attrs.get('lang') !== 'zh-CN' && !/\blang=["']zh(?:-CN)?["']/.test(originals[0].inner)) fail(file, 'Chinese original poem needs an explicit language marker');
    }
    const translations = classContents(doc.html, 'poem-translation');
    if (translations.length !== 1) fail(file, 'expected one poem-translation region');
    else {
      const translationText = normalizedText(translations[0].inner);
      if (Array.isArray(work.translationLines)) for (const line of work.translationLines) {
        if (!translationText.includes(line.replace(/\s+/g,' ').trim())) fail(file, 'reading translation is missing a supplied line');
      }
      if (translations[0].attrs.get('lang') !== 'en' && !/\blang=["']en["']/.test(translations[0].inner)) fail(file, 'English reading translation needs a language marker');
    }
    const translationLabel = normalizedText(doc.html);
    if (!/(?:English translation|英文译文)/i.test(translationLabel) || !/(?:AI assistance|AI\s*辅助)/i.test(translationLabel)) fail(file, 'missing explicit AI-assisted English translation label');
    const full = classContents(doc.html, 'artwork-full');
    if (full.length !== 1) fail(file, 'expected one artwork-full region');
    else {
      const images = parse(full[0].inner).tags.filter(t => t.name === 'img' && t.attrs.get('src') === work.image?.src);
      if (images.length !== 1) fail(file, 'detail must show its unmodified original image');
      else if (images[0].attrs.get('alt') !== work.alt?.[language]) fail(file, 'original image alt does not match this language');
    }
    const visible = normalizedText(doc.html);
    for (const field of ['author','sourceTitle']) if (typeof work[field]?.[language] === 'string' && !visible.includes(work[field][language].replace(/\s+/g,' ').trim())) fail(file, `missing ${field} attribution in this language`);
    if (!doc.tags.some(t => t.name === 'a' && t.attrs.get('href') === `/${prefix}art.html`)) fail(file, 'missing return to art overview in this language');
    for (const source of Array.isArray(work.sourceLinks) ? work.sourceLinks : []) if (!doc.tags.some(t => t.name === 'a' && t.attrs.get('href') === source.url)) fail(file, 'missing declared external literary source link');
  }
}

try {
  const sitemap = (await bytes('sitemap.xml')).toString('utf8');
  const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1]));
  for (const page of pages) if (!listed.includes(origin + route(page))) fail('sitemap.xml', `missing generated route: ${route(page)}`);
  if (new Set(listed).size !== listed.length) fail('sitemap.xml', 'duplicate route entries');
} catch { fail('sitemap.xml', 'missing or unreadable sitemap'); }

const protectedFiles = [
  ...['ray-speaking','autonomous-car','trail-running','ray-outdoors','strength'].map(name => `media/education/${name}.jpg`),
  'resume.html', 'media/Ray_Qin_Resume.pdf', 'media/Ray_Qin_Resume.docx', 'media/Ray_Resume.pdf',
  'pulse/privacy.html', 'pulse/support.html', 'life-garden/privacy.html', 'life-garden/support.html',
];
for (const file of protectedFiles) {
  try {
    const original = execFileSync('git', ['show', `${baseline}:${file}`], {cwd:root, maxBuffer:20 * 1024 * 1024, stdio:['ignore','pipe','pipe']});
    if (!(await bytes(file)).equals(original)) fail(file, `protected baseline asset changed from ${baseline.slice(0,7)}`);
  } catch { fail(file, 'unable to verify protected baseline file'); }
}
for (const file of ['_portfolio/articles.json','_portfolio/projects.json','_portfolio/artworks.json','assets/ray.css','assets/art.css','assets/ray.js','tools/art.mjs']) {
  try { contentScan(file, (await bytes(file)).toString('utf8')); } catch { fail(file, 'missing implementation file'); }
}
for (const [file, limit] of [['assets/ray.css',64 * 1024],['assets/art.css',16 * 1024],['assets/ray.js',16 * 1024]]) {
  try {
    const data = await bytes(file);
    console.log(`SIZE ${file}: ${data.length.toLocaleString()} B raw / ${gzipSync(data).length.toLocaleString()} B gzip; budget ${limit / 1024} KiB raw`);
    if (data.length > limit) fail(file, 'exceeds lightweight asset budget');
    if (extname(file) === '.css') for (const m of data.toString('utf8').matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/gi)) await reference(m[1], file);
  } catch { fail(file, 'unable to check asset size'); }
}
for (const file of ['assets/ray.js', 'tools/build.mjs', 'tools/art.mjs']) {
  try { execFileSync(process.execPath, ['--check', resolve(root,file)], {stdio:['ignore','pipe','pipe']}); }
  catch { fail(file, 'JavaScript syntax check failed'); }
}
for (const warning of warnings) console.warn(`WARN ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  console.error(`FAILED: ${errors.length} error(s); ${pages.length} pages, ${references} local references, ${exactParagraphs} exact original paragraphs, ${exactTranslationParagraphs} translation paragraphs, ${exactPoemLines} poem lines checked.`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${pages.length} generated pages; ${references} local references and anchors; ${exactParagraphs} exact original paragraphs; ${exactTranslationParagraphs} translation paragraphs; ${exactPoemLines} original poem lines; ${verifiedOriginalImages} original PNG hashes; reciprocal languages; ${protectedFiles.length} baseline files unchanged.`);
  console.log('Static gate only: no external-link availability, browser rendering, interaction, contrast, or human editorial verification is claimed.');
}
