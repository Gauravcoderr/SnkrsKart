import 'dotenv/config';
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer';
import { connectDB } from '../config/database';
import { Blog } from '../models/Blog';
import { Drop } from '../models/Drop';
import { SneakerProfile } from '../models/SneakerProfile';
import { InstagramPost } from '../models/InstagramPost';
import { IgMediaItem, validatePost } from '../lib/instagramRules';
import { blogStarter, DraftSpec, dropStarter, renderSlideHtml, slideSize, sneakerStarter } from '../lib/instagramSlides';
import { uploadDataUriToCloudinary } from './uploadBlogImage';

// Instagram draft pipeline used by the /drop, /blog and /sneaker skills.
//
//   npx ts-node --transpile-only src/scripts/igDraft.ts starter drop <slug> [<slug>...] [--out spec.json]
//   npx ts-node --transpile-only src/scripts/igDraft.ts starter blog <slug> [--out spec.json]
//   npx ts-node --transpile-only src/scripts/igDraft.ts starter sneaker <slug> [--out spec.json]
//   npx ts-node --transpile-only src/scripts/igDraft.ts render <spec.json> <outDir>
//   npx ts-node --transpile-only src/scripts/igDraft.ts create <spec.json> [--force] [--allow-watermark]
//
// "create" renders, uploads the JPEGs to Cloudinary (folder instagram/) and
// saves an InstagramPost with status "draft". It never approves or publishes:
// a human does that in /admin/instagram. It refuses images that carry another
// account's watermark (found with Apple Vision text recognition).

const ADMIN_URL = 'https://www.snkrscart.com/admin/instagram';
const LOGO_PATH = path.resolve(__dirname, '../../../frontend/public/logo.png');
const PLACEHOLDER = 'https://res.cloudinary.com/dadulg5bs/image/upload/placeholder.jpg';

// Runs inside the page. Takes the shoe's colours from the cut-out (the most
// common saturated hue), builds the background from it the way launch cards
// do (light shoe on a deep tone, dark shoe on a pale one), then shrinks every
// [data-fit] block until its text fits and lists images that failed to load.
// Passed as a string because the backend compiles without the DOM lib.
interface Palette { h: number; s: number; l: number; dark: boolean }

function pageScript(fallback: Palette | null): string {
  return `(async (fallback) => {
  await document.fonts.ready;
  const rgb2hsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  };
  const css = (h, s, l, a = 1) => 'hsla(' + h.toFixed(0) + ',' + (s * 100).toFixed(0) + '%,' + (l * 100).toFixed(0) + '%,' + a + ')';
  const layout = document.body.dataset.layout;
  const shoe = document.querySelector('img.shoe, img.fan');
  let pal = fallback || { h: 30, s: .04, l: .12, dark: true };
  if (shoe && shoe.complete && shoe.naturalWidth) {
    const w = 90, h = Math.max(1, Math.round(90 * shoe.naturalHeight / shoe.naturalWidth));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.drawImage(shoe, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data;
    const B = {}; let total = 0, lsum = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 200) continue;
      const [hh, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      total++; lsum += l;
      if (s < .22 || l < .14 || l > .9) continue;
      const k = Math.round(hh / 20) % 18;
      const b = B[k] || (B[k] = { n: 0, h: 0, s: 0, l: 0 });
      b.n++; b.h += hh; b.s += s; b.l += l;
    }
    const avgL = total ? lsum / total : .5;
    let best = null;
    for (const k in B) { const b = B[k]; const score = b.n * (.4 + b.s / b.n); if (!best || score > best.score) best = { ...b, score }; }
    const dark = avgL > .5;
    if (best && best.n > total * .05) {
      const sat = Math.min(.6, best.s / best.n);
      pal = { h: best.h / best.n, s: dark ? sat : Math.min(sat, .42), l: dark ? .25 : .85, dark };
    } else {
      pal = { h: 30, s: .05, l: dark ? .13 : .87, dark };
    }
  }
  if (layout === 'photo') pal = { ...pal, dark: true };
  const { h, s, l, dark } = pal, r = document.documentElement.style;
  r.setProperty('--bg', css(h, s, l));
  r.setProperty('--bg-hi', css(h, s, Math.min(.97, l + (dark ? .1 : .06))));
  r.setProperty('--bg-lo', css(h, s, Math.max(.04, l - .1)));
  r.setProperty('--ink', dark ? '#ffffff' : '#0d0d0d');
  r.setProperty('--ink-soft', dark ? 'rgba(255,255,255,.74)' : 'rgba(13,13,13,.66)');
  r.setProperty('--ghost', dark ? 'rgba(255,255,255,.085)' : 'rgba(0,0,0,.075)');
  r.setProperty('--line', dark ? 'rgba(255,255,255,.24)' : 'rgba(0,0,0,.18)');
  document.body.classList.toggle('on-dark', dark);
  document.body.classList.toggle('on-light', !dark);
  document.querySelectorAll('[data-fit-width]').forEach((el) => {
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 1 && size > 120) { size -= 6; el.style.fontSize = size + 'px'; }
  });
  document.querySelectorAll('[data-fit]').forEach((el) => {
    const cs = getComputedStyle(el);
    let size = parseFloat(cs.fontSize);
    const min = Number(el.dataset.min || 40);
    const limit = parseFloat(cs.maxHeight) || el.clientHeight;
    while ((el.scrollHeight > limit + 2 || el.scrollWidth > el.clientWidth + 1) && size > min) { size -= 4; el.style.fontSize = size + 'px'; }
  });
  const bad = Array.from(document.images).filter((im) => !im.complete || im.naturalWidth === 0).map((im) => im.src.slice(0, 120));
  return { pal, bad };
})(${JSON.stringify(fallback)})`;
}

// ─── shoe cut-out (macOS, Apple Vision) ────────────────────────────────────

const CACHE_DIR = path.join(os.homedir(), '.cache', 'snkrs-cart');
const CUTOUT_SRC = path.resolve(__dirname, 'igCutout.swift');
const CUTOUT_BIN = path.join(CACHE_DIR, 'ig-cutout');

function cutoutTool(): string | null {
  if (process.platform !== 'darwin' || process.env.IG_NO_CUTOUT === '1') return null;
  try {
    const fresh = fs.existsSync(CUTOUT_BIN) && fs.statSync(CUTOUT_BIN).mtimeMs >= fs.statSync(CUTOUT_SRC).mtimeMs;
    if (!fresh) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      execFileSync('swiftc', ['-O', CUTOUT_SRC, '-o', CUTOUT_BIN], { stdio: 'ignore', timeout: 240_000 });
    }
    return CUTOUT_BIN;
  } catch {
    return null;
  }
}

// Text another account stamped on a photo: an @handle, a web address or a
// copyright mark. Shoe branding (NIKE, JUMPMAN, 23) does not match.
export function watermarkLines(lines: string[]): string[] {
  return lines.filter((l) => /@[A-Za-z0-9_.]{3,}|\b[a-z0-9-]+\.(com|net|in|co|org|io)\b|www\.|©/i.test(l));
}

interface PreparedImage {
  cutout: string | null;
  watermark: string[];
}

// Downloads the image once, finds any watermark text, and (for hero and info
// slides) cuts the shoe out as a transparent PNG data URI. Without the tool
// (not macOS) both steps are skipped and the slide uses the full-bleed photo.
async function prepareImage(url: string, tool: string | null, wantCutout: boolean): Promise<PreparedImage> {
  const none = { cutout: null, watermark: [] };
  if (!tool || !/^https:\/\//.test(url)) return none;
  const key = crypto.createHash('sha1').update(url).digest('hex');
  const dir = path.join(CACHE_DIR, 'ig-cutouts');
  const input = path.join(dir, `${key}.src`);
  const out = path.join(dir, `${key}.png`);
  const textFile = path.join(dir, `${key}.txt`);
  try {
    fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(input)) {
      const src = url.replace(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/, '$1c_limit,w_1800,f_png/');
      const res = await fetch(src, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) return none;
      fs.writeFileSync(input, Buffer.from(await res.arrayBuffer()));
    }
    if (!fs.existsSync(textFile)) {
      fs.writeFileSync(textFile, execFileSync(tool, ['--text', input], { timeout: 60_000 }).toString());
    }
    const watermark = watermarkLines(fs.readFileSync(textFile, 'utf8').split('\n').filter(Boolean));
    if (!wantCutout) return { cutout: null, watermark };
    if (!fs.existsSync(out)) {
      try {
        execFileSync(tool, [input, out], { stdio: 'ignore', timeout: 60_000 });
      } catch {
        return { cutout: null, watermark };
      }
    }
    return { cutout: `data:image/png;base64,${fs.readFileSync(out).toString('base64')}`, watermark };
  } catch {
    return none;
  }
}

// Puppeteer's own Chrome first, then IG_CHROME_PATH, then an installed
// Chrome. A half-finished browser download in ~/.cache/puppeteer should not
// stop an unattended content run.
async function launchBrowser() {
  const candidates = [
    process.env.IG_CHROME_PATH,
    undefined,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter((p, i, all) => all.indexOf(p) === i && (p === undefined || fs.existsSync(p)));
  let lastError: Error | null = null;
  for (const executablePath of candidates) {
    try {
      return await puppeteer.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
    } catch (err) {
      lastError = err as Error;
    }
  }
  throw new Error(`Could not start Chrome. Set IG_CHROME_PATH or run "npx puppeteer browsers install chrome". Last error: ${lastError?.message.split('\n')[0]}`);
}

function logoDataUri(): string {
  try {
    return `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`;
  } catch {
    return '';
  }
}

function readSpec(file: string): DraftSpec {
  const spec = JSON.parse(fs.readFileSync(file, 'utf8')) as DraftSpec;
  if (!spec.kind || !spec.source || typeof spec.caption !== 'string') throw new Error('Spec needs kind, source and caption');
  return spec;
}

export interface RenderResult {
  files: string[];
  warnings: string[];
}

export async function renderSlides(spec: DraftSpec, outDir: string): Promise<RenderResult> {
  const slides = spec.slides ?? [];
  if (slides.length === 0) return { files: [], warnings: [] };
  fs.mkdirSync(outDir, { recursive: true });
  const { width, height } = slideSize(spec.kind);
  const logo = logoDataUri();
  const tool = cutoutTool();
  if (!tool) console.warn('  note: no cut-out tool (needs macOS + swiftc), hero and info slides fall back to full-bleed photos');
  const prepared = await Promise.all(
    slides.map(async (sl) => {
      const main = sl.image ? await prepareImage(sl.image, tool, sl.layout === 'hero' || sl.layout === 'info') : { cutout: null, watermark: [] };
      const extras = await Promise.all((sl.images ?? []).slice(0, 3).map((u) => prepareImage(u, tool, true)));
      return { main, extras };
    }),
  );
  const warnings: string[] = [];
  prepared.forEach((p, i) => {
    const marks = [...p.main.watermark, ...p.extras.flatMap((x) => x.watermark)];
    if (marks.length) warnings.push(`Slide ${i + 1}: the image carries a watermark (${marks.join(' | ')}). Use our own photo or a clean brand image.`);
  });
  const browser = await launchBrowser();
  const files: string[] = [];
  let carouselPalette: Palette | null = null;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    for (let i = 0; i < slides.length; i++) {
      const cut = prepared[i].main.cutout;
      const extraCutouts = prepared[i].extras.map((x) => x.cutout).filter((c): c is string => Boolean(c));
      const html = renderSlideHtml(slides[i], { width, height, index: i, total: slides.length, logoDataUri: logo, cutoutDataUri: cut ?? undefined, extraCutouts });
      await page.setContent(html, { waitUntil: 'load', timeout: 60_000 });
      const hasShoe = Boolean(cut) || extraCutouts.length > 0;
      const r = (await page.evaluate(pageScript(hasShoe ? null : carouselPalette))) as { pal: Palette; bad: string[] };
      if (r.bad.length) throw new Error(`Slide ${i + 1}: image failed to load: ${r.bad.join(', ')}`);
      if (hasShoe && !carouselPalette) carouselPalette = r.pal;
      const file = path.join(outDir, `slide-${String(i + 1).padStart(2, '0')}.jpg`);
      await page.screenshot({ path: file as `${string}.jpeg`, type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width, height } });
      files.push(file);
    }
  } finally {
    await browser.close();
  }
  return { files, warnings };
}

async function starter(kind: string, slugs: string[]): Promise<DraftSpec> {
  await connectDB();
  if (kind === 'drop') {
    const drops = await Drop.find({ slug: { $in: slugs } }).lean();
    const ordered = slugs.map((s) => drops.find((d) => d.slug === s)).filter((d): d is NonNullable<typeof d> => Boolean(d));
    if (ordered.length !== slugs.length) throw new Error(`Drops not found: ${slugs.filter((s) => !drops.some((d) => d.slug === s)).join(', ')}`);
    ordered.sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
    return dropStarter(ordered);
  }
  if (kind === 'blog') {
    const blog = await Blog.findOne({ slug: slugs[0] }).lean();
    if (!blog) throw new Error(`Blog not found: ${slugs[0]}`);
    return blogStarter(blog);
  }
  if (kind === 'sneaker') {
    const profile = await SneakerProfile.findOne({ slug: slugs[0] }).lean();
    if (!profile) throw new Error(`Sneaker profile not found: ${slugs[0]}`);
    return sneakerStarter(profile);
  }
  throw new Error(`Unknown starter kind "${kind}" (drop, blog or sneaker)`);
}

async function create(spec: DraftSpec, force: boolean, allowWatermark: boolean): Promise<void> {
  const slides = spec.slides ?? [];
  const planned: IgMediaItem[] = slides.length
    ? slides.map((s) => ({ url: PLACEHOLDER, type: 'IMAGE', altText: s.altText ?? '' }))
    : spec.media ?? [];
  const problems = validatePost({ kind: spec.kind, caption: spec.caption, media: planned, coverUrl: spec.coverUrl });
  if (problems.length) {
    console.error('❌ Fix these before creating the draft:\n  - ' + problems.join('\n  - '));
    process.exit(2);
  }

  await connectDB();
  const existing = await InstagramPost.findOne({
    'source.kind': spec.source.kind,
    'source.slug': spec.source.slug,
    kind: spec.kind,
    status: { $ne: 'rejected' },
  }).lean();
  if (existing && !force) {
    console.error(`❌ A ${existing.status} ${spec.kind} for ${spec.source.kind}/${spec.source.slug} already exists (${existing._id}). Pass --force to add another.`);
    process.exit(3);
  }

  let media = planned;
  if (slides.length) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ig-slides-'));
    const { files, warnings } = await renderSlides(spec, dir);
    warnings.forEach((w) => console.warn(`  ⚠️  ${w}`));
    if (warnings.length && !allowWatermark) {
      console.error('❌ Not uploading: another account\'s watermark would be posted under our name. Swap the image, or pass --allow-watermark if you own it.');
      process.exit(4);
    }
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const folder = `instagram/${spec.source.slug || 'manual'}-${stamp}`;
    media = [];
    for (let i = 0; i < files.length; i++) {
      const uri = `data:image/jpeg;base64,${fs.readFileSync(files[i]).toString('base64')}`;
      const url = await uploadDataUriToCloudinary(uri, `slide-${i + 1}-${Date.now()}`, folder);
      media.push({ url, type: 'IMAGE', altText: slides[i].altText ?? '' });
      console.log(`  uploaded ${i + 1}/${files.length}: ${url}`);
    }
  }

  const post = await InstagramPost.create({
    kind: spec.kind,
    caption: spec.caption,
    media,
    coverUrl: spec.coverUrl ?? '',
    source: spec.source,
    scheduledAt: spec.scheduledAt ? new Date(spec.scheduledAt) : null,
    notes: spec.notes ?? '',
    status: 'draft',
    createdBy: 'pipeline',
  });
  console.log(`✅ Instagram draft ${post._id} (${spec.kind}, ${media.length} items) → ${ADMIN_URL}`);
}

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;
  const flag = (name: string) => {
    const i = rest.indexOf(name);
    if (i === -1) return undefined;
    const v = rest[i + 1];
    rest.splice(i, 2);
    return v;
  };

  if (cmd === 'starter') {
    const out = flag('--out');
    const [kind, ...slugs] = rest;
    if (!kind || slugs.length === 0) throw new Error('Usage: starter <drop|blog|sneaker> <slug...> [--out spec.json]');
    const spec = await starter(kind, slugs);
    const json = JSON.stringify(spec, null, 2) + '\n';
    if (out) {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, json);
      console.log(`✅ Starter spec written to ${out}. Write the caption, then run "create".`);
    } else process.stdout.write(json);
    return;
  }
  if (cmd === 'render') {
    const [file, outDir] = rest;
    if (!file || !outDir) throw new Error('Usage: render <spec.json> <outDir>');
    const { files, warnings } = await renderSlides(readSpec(file), outDir);
    files.forEach((f) => console.log(f));
    warnings.forEach((w) => console.warn(`⚠️  ${w}`));
    return;
  }
  if (cmd === 'create') {
    const force = rest.includes('--force');
    const file = rest.find((a) => !a.startsWith('--'));
    if (!file) throw new Error('Usage: create <spec.json> [--force] [--allow-watermark]');
    await create(readSpec(file), force, rest.includes('--allow-watermark'));
    return;
  }
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n'));
}

if (require.main === module) {
  main()
    .then(async () => {
      await mongoose.disconnect().catch(() => {});
      process.exit(0);
    })
    .catch(async (e: Error) => {
      console.error('❌', e.message);
      await mongoose.disconnect().catch(() => {});
      process.exit(1);
    });
}
