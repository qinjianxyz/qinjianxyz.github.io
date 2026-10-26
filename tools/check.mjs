#!/usr/bin/env node
// Dependency-free static gate. Does not build, serve, fetch, or modify the site.
import { readFile, stat, realpath } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const origin = 'https://qinjianxyz.github.io';
const baseline = '101471de6c7355a376334e61f578c31a627193f9';
const errors = [];
const warnings = [];
const documents = new Map();
const files = new Map();
let references = 0;
let exactParagraphs = 0;
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
if (!Array.isArray(articles) || articles.length !== 2) {
  console.error('FAIL _portfolio/articles.json: this gate expects the two reviewed source articles');
  process.exit(1);
}
const slugs = new Set();
for (const article of articles) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug) || slugs.has(article.slug)) fail('_portfolio/articles.json', 'invalid or duplicate article slug');
  slugs.add(article.slug);
  if (!Array.isArray(article.paragraphs) || !article.paragraphs.length || article.paragraphs.some(p => typeof p !== 'string' || !p.trim())) fail('_portfolio/articles.json', 'article paragraphs must be nonempty strings');
  if (!/^https:\/\/x\.com\/rayq_ai\/status\/\d+$/.test(article.sourceUrl ?? '')) fail('_portfolio/articles.json', 'article source must identify Ray’s original X post');
  if (!Number.isFinite(Date.parse(article.publishedAt))) fail('_portfolio/articles.json', 'invalid publication timestamp');
}
const basePages = ['index.html', 'work.html', 'writing.html', 'about.html', ...articles.map(a => `writing/${a.slug}.html`)];
const pages = basePages.flatMap(file => [file, `en/${file}`]);

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
  const expectedLanguage = file.startsWith('en/') ? 'en' : 'zh-CN';
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
    const bare = file.replace(/^en\//, '');
    const expected = origin + route((language === 'en' ? 'en/' : '') + bare);
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
    const expectedFile = file.startsWith('en/') ? file.slice(3) : `en/${file}`;
    const target = localURL(languageLink.attrs.get('href') ?? '', file);
    if (target?.file !== expectedFile) fail(file, 'language switch does not lead to the counterpart page');
    else try {
      const other = await document(expectedFile);
      const back = other.tags.find(t => t.name === 'a' && (t.attrs.get('class') ?? '').split(/\s+/).includes('language-link'));
      if (!back || localURL(back.attrs.get('href') ?? '', expectedFile)?.file !== file) fail(file, 'language switch is not reciprocal');
    } catch { fail(file, 'language counterpart is missing'); }
  }
  if (Buffer.byteLength(doc.html) > 96 * 1024) warn(file, 'HTML exceeds 96 KiB review budget');
}

for (const article of articles) {
  if (!Array.isArray(article.paragraphs)) continue;
  for (const prefix of ['', 'en/']) {
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
  }
}

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
for (const file of ['_portfolio/articles.json','_portfolio/projects.json','assets/ray.css','assets/ray.js']) {
  try { contentScan(file, (await bytes(file)).toString('utf8')); } catch { fail(file, 'missing implementation file'); }
}
for (const [file, limit] of [['assets/ray.css',64 * 1024],['assets/ray.js',16 * 1024]]) {
  try {
    const data = await bytes(file);
    console.log(`SIZE ${file}: ${data.length.toLocaleString()} B raw / ${gzipSync(data).length.toLocaleString()} B gzip; budget ${limit / 1024} KiB raw`);
    if (data.length > limit) fail(file, 'exceeds lightweight asset budget');
    if (extname(file) === '.css') for (const m of data.toString('utf8').matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/gi)) await reference(m[1], file);
  } catch { fail(file, 'unable to check asset size'); }
}
for (const file of ['assets/ray.js', 'tools/build.mjs']) {
  try { execFileSync(process.execPath, ['--check', resolve(root,file)], {stdio:['ignore','pipe','pipe']}); }
  catch { fail(file, 'JavaScript syntax check failed'); }
}
for (const warning of warnings) console.warn(`WARN ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  console.error(`FAILED: ${errors.length} error(s); ${pages.length} pages, ${references} local references, ${exactParagraphs} exact original paragraphs checked.`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${pages.length} pages; ${references} local references and anchors; ${exactParagraphs} exact original paragraphs; reciprocal languages; ${protectedFiles.length} baseline files unchanged.`);
  console.log('Static gate only: no external-link availability, browser rendering, interaction, contrast, or human editorial verification is claimed.');
}
