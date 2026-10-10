import { IgKind, IgMediaItem, IgSourceKind } from './instagramRules';

// Slide specs and the HTML that igDraft.ts screenshots into 1080x1350 (feed)
// or 1080x1920 (story) JPEGs. The look follows how real sneaker accounts post
// (launch cards in the style of Nike SNKRS, "release info" cards like the big
// sneaker news accounts): full-bleed colour taken from the shoe, a big cut-out
// shoe with a real shadow, a ghost nickname behind it, little text.
//
// Every fact on a starter slide comes from the Mongo record; nothing is
// invented here.

export const SITE_HOST = 'snkrscart.com';

export type SlideLayout = 'hero' | 'info' | 'angle' | 'schedule' | 'photo' | 'text' | 'cta';

export interface SlideSpec {
  layout: SlideLayout;
  kicker?: string;
  brand?: string;
  title: string;
  subtitle?: string;
  body?: string;
  image?: string;
  images?: string[];
  ghost?: string;
  badge?: { big: string; small: string[]; variant?: 'date' | 'price' };
  rows?: string[][];
  altText?: string;
}

export interface DraftSpec {
  kind: IgKind;
  source: { kind: IgSourceKind; slug: string };
  caption: string;
  scheduledAt?: string | null;
  notes?: string;
  slides?: SlideSpec[];
  media?: IgMediaItem[];
  coverUrl?: string;
}

export const CAPTION_TODO = '{{write the caption with /ig-caption, then /ig-human}}';

export function slideSize(kind: IgKind): { width: number; height: number } {
  return kind === 'STORIES' ? { width: 1080, height: 1920 } : { width: 1080, height: 1350 };
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

function safeSrc(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  try {
    if (new URL(url).protocol !== 'https:') return '';
  } catch {
    return '';
  }
  return url.replace(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/, '$1c_limit,w_1800,q_auto:best/');
}

// ─── formatting helpers (shared with the starters) ─────────────────────────

export function formatPrice(price: number | null | undefined, currency: 'INR' | 'USD' = 'INR'): string | null {
  if (price === null || price === undefined || !Number.isFinite(price) || price <= 0) return null;
  return currency === 'USD' ? `US retail $${price.toLocaleString('en-US')}` : `₹${price.toLocaleString('en-IN')}`;
}

// Release dates are stored as midnight UTC, so read them in UTC.
export function formatReleaseDate(date: Date): string {
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
  const dm = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${day} ${dm}`;
}

export function dateBadge(date: Date): { big: string; small: string[] } {
  return {
    big: String(date.getUTCDate()),
    small: [
      date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
      date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }).toUpperCase(),
    ],
  };
}

export function formatLaunchTime(hhmm: string | undefined): string | null {
  if (!hhmm || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'} IST`;
}

const GENERIC = new Set(['low', 'mid', 'high', 'og', 'retro', 'sp', 'qs', 'se', 'premium', 'prm', 'nike', 'air', 'jordan', 'adidas', 'new', 'balance']);

// The word sneaker people call the pair by: the quoted nickname if there is
// one ("Fireside"), else the last non-generic word of the name.
export function ghostWord(name: string): string {
  const quoted = name.match(/["“”']([^"“”']{2,24})["“”']/);
  if (quoted) return quoted[1].toUpperCase();
  const words = name.split(/\s+/).filter((w) => !GENERIC.has(w.toLowerCase()) && !/^\d+$/.test(w));
  return (words[words.length - 1] ?? name).toUpperCase();
}

function stripNickname(name: string): string {
  return name.replace(/\s*["“”'][^"“”']{2,24}["“”']\s*/, ' ').trim();
}

// ─── HTML ──────────────────────────────────────────────────────────────────

const FONTS = 'https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=block';

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

function css(width: number, height: number): string {
  const story = height > 1500;
  return `
  :root { --bg:#1d1d1f; --bg-hi:#2a2a2d; --bg-lo:#111112; --ink:#ffffff; --ink-soft:rgba(255,255,255,.72);
    --ghost:rgba(255,255,255,.09); --line:rgba(255,255,255,.22); --pad:72px; --safe:${story ? 230 : 0}px; }
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { width:${width}px; height:${height}px; overflow:hidden; }
  body { font-family:'Inter', Helvetica, Arial, sans-serif; color:var(--ink); -webkit-font-smoothing:antialiased;
    background:radial-gradient(ellipse 85% 60% at 50% 44%, var(--bg-hi) 0%, var(--bg) 52%, var(--bg-lo) 100%); }
  body::after { content:''; position:absolute; inset:0; background-image:${GRAIN}; opacity:.10; mix-blend-mode:overlay; pointer-events:none; }
  .abs { position:absolute; }
  .display { font-family:'Anton', Impact, 'Arial Narrow', sans-serif; text-transform:uppercase; line-height:.9; letter-spacing:.005em; }
  .top { left:var(--pad); right:var(--pad); top:calc(var(--pad) + var(--safe)); display:flex; justify-content:space-between; align-items:center; height:88px; }
  .logo { width:92px; height:92px; }
  .on-dark .logo { filter:invert(1); mix-blend-mode:screen; }
  .on-light .logo { mix-blend-mode:multiply; }
  .pill { border:2.5px solid var(--ink); border-radius:999px; padding:12px 26px; font-weight:800; font-size:24px; letter-spacing:.16em; text-transform:uppercase; }
  .count { font-weight:600; font-size:24px; letter-spacing:.14em; color:var(--ink-soft); }
  .ghost { left:-20px; right:-20px; text-align:center; white-space:nowrap; color:var(--ghost); font-size:420px; overflow:hidden; }
  .shoe { left:50%; transform:translateX(-50%) rotate(var(--tilt, -9deg)); object-fit:contain;
    filter:drop-shadow(0 34px 30px rgba(0,0,0,.38)) drop-shadow(0 8px 10px rgba(0,0,0,.22)); }
  .floor { left:50%; transform:translateX(-50%); width:760px; height:90px; border-radius:50%;
    background:radial-gradient(ellipse at center, rgba(0,0,0,.42) 0%, rgba(0,0,0,0) 70%); filter:blur(6px); }
  .brand { font-weight:800; font-size:24px; letter-spacing:.22em; text-transform:uppercase; color:var(--ink-soft); }
  .name { font-size:96px; margin-top:12px; overflow:hidden; }
  .sub { font-weight:500; font-size:30px; color:var(--ink-soft); margin-top:14px; line-height:1.25; }
  .badge { text-align:right; }
  .badge .big { font-size:200px; line-height:.8; }
  .badge .small { font-weight:800; font-size:26px; letter-spacing:.2em; margin-top:14px; }
  .badge.price .big { font-size:104px; line-height:.9; }
  .badge.price .small { margin:0 0 10px; }
  .rows { left:var(--pad); right:var(--pad); }
  .row { display:flex; justify-content:space-between; align-items:baseline; gap:24px; padding:26px 0; border-top:2px solid var(--line); }
  .row:last-child { border-bottom:2px solid var(--line); }
  .row .k { font-weight:700; font-size:22px; letter-spacing:.2em; text-transform:uppercase; color:var(--ink-soft); flex:none; }
  .row .v { font-family:'Anton', Impact, sans-serif; font-size:52px; text-transform:uppercase; text-align:right; line-height:1.05; }
  .sched .row { align-items:center; }
  .sched .d { font-family:'Anton', Impact, sans-serif; font-size:64px; min-width:190px; flex:none; line-height:.95; }
  .sched .n { flex:1; font-weight:700; font-size:34px; line-height:1.2; }
  .sched .p { font-weight:600; font-size:26px; color:var(--ink-soft); text-align:right; flex:none; }
  .fan { object-fit:contain; filter:drop-shadow(0 26px 22px rgba(0,0,0,.4)); }
  .photo-img { inset:0; width:100%; height:100%; object-fit:cover; }
  .scrim { inset:0; background:linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 50%, rgba(0,0,0,.82) 100%); }
  .body { font-size:42px; line-height:1.38; font-weight:500; white-space:pre-line; overflow:hidden; }
  .url { display:inline-block; background:var(--ink); color:var(--bg); border-radius:999px; padding:20px 38px; font-weight:800; font-size:40px; }
  `;
}

export interface RenderOptions {
  width: number;
  height: number;
  index: number;
  total: number;
  logoDataUri: string;
  // A transparent PNG of the shoe (data URI) when the cut-out step worked.
  cutoutDataUri?: string;
  // Cut-outs for the shoes on a schedule (roundup) cover.
  extraCutouts?: string[];
}

function badgeHtml(b: NonNullable<SlideSpec['badge']>, e: (v: string | undefined) => string): string {
  if (b.variant === 'price') {
    return `<div class="badge price"><div class="small">${b.small.map(e).join('<br>')}</div><div class="display big">${e(b.big)}</div></div>`;
  }
  return `<div class="badge"><div class="display big">${e(b.big)}</div><div class="small">${b.small.map(e).join('<br>')}</div></div>`;
}

// Up to three shoes fanned out between the headline and the calendar rows.
function fan(cutouts: string[], story: boolean): string {
  const spots = [
    { left: 60, top: 10, rot: -10, z: 1 },
    { left: 330, top: 60, rot: 0, z: 3 },
    { left: 600, top: 10, rot: 10, z: 2 },
  ];
  const picked = cutouts.length === 1 ? [spots[1]] : cutouts.length === 2 ? [spots[0], spots[2]] : spots;
  const base = story ? 820 : 500;
  return cutouts
    .slice(0, 3)
    .map((src, i) => {
      const s = picked[i];
      return `<img class="abs fan" src="${escapeHtml(src)}" alt="" style="left:${s.left}px;top:${base + s.top}px;width:400px;height:290px;transform:rotate(${s.rot}deg);z-index:${s.z}">`;
    })
    .join('');
}

export function renderSlideHtml(slide: SlideSpec, o: RenderOptions): string {
  const e = (v: string | undefined) => escapeHtml(v ?? '');
  const story = o.height > 1500;
  const H = o.height;
  const logo = o.logoDataUri ? `<img class="logo" src="${escapeHtml(o.logoDataUri)}" alt="">` : '<span></span>';
  const count = o.total > 1 ? `<span class="count">${o.index + 1} / ${o.total}</span>` : '<span></span>';
  const shoeSrc = o.cutoutDataUri ? escapeHtml(o.cutoutDataUri) : '';
  const photoSrc = escapeHtml(safeSrc(slide.image));

  // No cut-out available: a hero or info slide falls back to full-bleed photo.
  const layout: SlideLayout = (slide.layout === 'hero' || slide.layout === 'info' || slide.layout === 'angle') && !shoeSrc && photoSrc ? 'photo' : slide.layout;
  let inner = '';

  switch (layout) {
    case 'hero': {
      const shoeTop = story ? 620 : 330;
      inner = `
      <div class="abs top">${logo}${slide.kicker ? `<span class="pill">${e(slide.kicker)}</span>` : count}</div>
      <div class="abs ghost display" data-fit-width style="top:${story ? 560 : 300}px">${e(slide.ghost)}</div>
      <div class="abs floor" style="top:${shoeTop + 560}px"></div>
      <img class="abs shoe" src="${shoeSrc}" alt="" style="top:${shoeTop}px;width:980px;height:620px">
      <div class="abs" style="left:var(--pad);right:var(--pad);bottom:calc(var(--pad) + var(--safe));display:flex;justify-content:space-between;align-items:flex-end;gap:32px">
        <div style="flex:1;min-width:0">
          <div class="brand">${e(slide.brand)}</div>
          <div class="display name" data-fit data-min="54" style="max-height:${story ? 300 : 200}px">${e(slide.title)}</div>
          ${slide.subtitle ? `<div class="sub">${e(slide.subtitle)}</div>` : ''}
        </div>
        ${slide.badge ? badgeHtml(slide.badge, e) : ''}
      </div>`;
      break;
    }
    case 'info': {
      const rows = (slide.rows ?? []).filter((r) => r[1]);
      inner = `
      <div class="abs top">${count}${logo}</div>
      <img class="abs shoe" src="${shoeSrc}" alt="" style="--tilt:0deg;top:${story ? 400 : 190}px;width:860px;height:${story ? 560 : 430}px">
      <div class="abs floor" style="top:${story ? 900 : 560}px;width:620px"></div>
      <div class="abs" style="left:var(--pad);right:var(--pad);top:${story ? 1040 : 680}px">
        <div class="brand">${e(slide.brand || slide.kicker)}</div>
        <div class="display name" data-fit data-min="48" style="font-size:80px;max-height:150px">${e(slide.title)}</div>
      </div>
      <div class="abs rows" style="bottom:calc(var(--pad) + var(--safe))">
        ${rows.map((r) => `<div class="row"><span class="k">${e(r[0])}</span><span class="v">${e(r[1])}</span></div>`).join('')}
      </div>`;
      break;
    }
    case 'angle':
      inner = `
      <div class="abs top">${count}${logo}</div>
      <div class="abs floor" style="top:${story ? 1260 : 960}px;width:820px"></div>
      <img class="abs shoe" src="${shoeSrc}" alt="" style="--tilt:0deg;top:${story ? 560 : 300}px;width:1000px;height:${story ? 720 : 680}px">
      <div class="abs" style="left:var(--pad);right:var(--pad);bottom:calc(var(--pad) + var(--safe))">
        <div class="brand">${e(slide.brand || slide.kicker)}</div>
        <div class="sub" style="margin-top:8px;font-weight:700;color:var(--ink)">${e(slide.title)}</div>
      </div>`;
      break;
    case 'photo':
      inner = `
      <img class="abs photo-img" src="${photoSrc}" alt="">
      <div class="abs scrim"></div>
      <div class="abs top">${count}${logo}</div>
      <div class="abs" style="left:var(--pad);right:var(--pad);bottom:calc(var(--pad) + var(--safe))">
        <div class="brand" style="color:#fff">${e(slide.brand || slide.kicker)}</div>
        <div class="display name" data-fit data-min="54" style="max-height:200px;color:#fff">${e(slide.title)}</div>
        ${slide.subtitle ? `<div class="sub" style="color:rgba(255,255,255,.8)">${e(slide.subtitle)}</div>` : ''}
        ${(slide.rows ?? []).filter((r) => r[1]).length ? `<div class="sub" style="color:#fff;font-weight:700;margin-top:22px">${(slide.rows ?? []).filter((r) => r[1]).map((r) => e(r[1])).join('&nbsp;&nbsp;·&nbsp;&nbsp;')}</div>` : ''}
      </div>`;
      break;
    case 'schedule':
      inner = `
      <div class="abs top">${count}${logo}</div>
      <div class="abs" style="left:var(--pad);right:var(--pad);top:${story ? 400 : 220}px">
        <div class="brand">${e(slide.kicker)}</div>
        <div class="display" data-fit data-min="80" style="font-size:150px;max-height:280px;margin-top:14px;overflow:hidden">${e(slide.title)}</div>
      </div>
      ${fan(o.extraCutouts ?? [], story)}
      <div class="abs rows sched" style="bottom:calc(var(--pad) + var(--safe))">
        ${(slide.rows ?? []).map((r) => `<div class="row"><span class="d">${e(r[0])}</span><span class="n">${e(r[1])}</span><span class="p">${e(r[2])}</span></div>`).join('')}
      </div>`;
      break;
    case 'text':
      inner = `
      <div class="abs top">${count}${logo}</div>
      <div class="abs" style="left:var(--pad);right:var(--pad);top:${story ? 420 : 240}px;bottom:calc(var(--pad) + var(--safe));display:flex;flex-direction:column">
        <div class="brand">${e(slide.kicker)}</div>
        <div class="display" data-fit data-min="64" style="font-size:120px;max-height:${story ? 520 : 340}px;margin:16px 0 40px;overflow:hidden">${e(slide.title)}</div>
        <p class="body" data-fit data-min="28" style="flex:1">${e(slide.body)}</p>
      </div>`;
      break;
    case 'cta':
    default:
      inner = `
      <div class="abs top">${count}<span></span></div>
      <div class="abs" style="left:var(--pad);right:var(--pad);top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:44px">
        <img class="logo" src="${escapeHtml(o.logoDataUri)}" alt="" style="width:180px;height:180px">
        <div class="display" data-fit data-min="90" style="font-size:190px;max-height:${story ? 560 : 360}px;overflow:hidden">${e(slide.title)}</div>
        ${slide.body ? `<div><span class="url">${e(slide.body)}</span></div>` : ''}
      </div>
      <div class="abs sub" style="left:var(--pad);right:var(--pad);bottom:calc(var(--pad) + var(--safe))">${e(slide.subtitle)}</div>`;
  }

  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="${FONTS}">
  <style>${css(o.width, o.height)}</style></head>
  <body class="on-dark" data-layout="${layout}" style="height:${H}px">${inner}</body></html>`;
}

// ─── starter specs from Mongo records ──────────────────────────────────────

export interface DropLike {
  slug: string;
  name: string;
  brand: string;
  colorway?: string;
  releaseDate: Date;
  retailPrice?: number | null;
  currency?: 'INR' | 'USD';
  image?: string;
  images?: string[];
  where?: string;
  styleCode?: string;
  launchTimeIST?: string;
}

function altFor(name: string, colorway?: string): string {
  return `${name}${colorway ? ` in the ${colorway} colourway` : ''}, product photo`;
}

function dropRows(d: DropLike): string[][] {
  const time = formatLaunchTime(d.launchTimeIST);
  return [
    ['Release', formatReleaseDate(new Date(d.releaseDate)) + (time ? `, ${time}` : '')],
    ['Price', formatPrice(d.retailPrice, d.currency) ?? ''],
    ['Where', (d.where ?? '').split(/\s*\/\s*/)[0]],
    ['Style', d.styleCode ?? ''],
  ];
}

function dropHero(d: DropLike, kicker: string): SlideSpec {
  return {
    layout: 'hero',
    kicker,
    brand: d.brand,
    title: stripNickname(d.name),
    subtitle: d.colorway ?? '',
    ghost: ghostWord(d.name),
    image: d.image,
    badge: dateBadge(new Date(d.releaseDate)),
    altText: altFor(d.name, d.colorway),
  };
}

export function dropStarter(drops: DropLike[]): DraftSpec {
  if (drops.length === 0) throw new Error('No drops given');
  const first = drops[0];
  const last = drops[drops.length - 1];
  const cta: SlideSpec = {
    layout: 'cta',
    title: drops.length === 1 ? 'Set a reminder' : 'Full drop calendar',
    body: drops.length === 1 ? `${SITE_HOST}/drops/${first.slug}` : `${SITE_HOST}/drops`,
    subtitle: 'Independent reseller. Release info from official brand sources.',
    altText: 'SNKRS CART drop calendar link',
  };

  if (drops.length === 1) {
    const extra = (first.images ?? []).slice(0, 2).map((src) => ({ layout: 'photo' as const, brand: first.brand, title: stripNickname(first.name), subtitle: first.colorway ?? '', image: src, altText: altFor(first.name, first.colorway) }));
    return {
      kind: 'CAROUSEL',
      source: { kind: 'drop', slug: first.slug },
      caption: CAPTION_TODO,
      scheduledAt: null,
      slides: [
        dropHero(first, 'Drop'),
        { layout: 'info', brand: first.brand, title: stripNickname(first.name), image: first.image, rows: dropRows(first), altText: altFor(first.name, first.colorway) },
        ...extra,
        cta,
      ],
    };
  }

  const span = (d: Date) => `${d.getUTCDate()} ${d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}`;
  const range = first.releaseDate === last.releaseDate ? span(new Date(first.releaseDate)) : `${span(new Date(first.releaseDate))} to ${span(new Date(last.releaseDate))}`;
  const slides: SlideSpec[] = [
    {
      layout: 'schedule',
      kicker: `Release calendar · ${range}`,
      title: `${drops.length} drops this week`,
      images: drops.slice(0, 3).map((d) => d.image ?? '').filter(Boolean),
      rows: drops.map((d) => [
        `${new Date(d.releaseDate).getUTCDate()} ${new Date(d.releaseDate).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase()}`,
        d.name,
        formatPrice(d.retailPrice, d.currency) ?? '',
      ]),
      altText: `Release calendar: ${drops.map((d) => d.name).join(', ')}`,
    },
    ...drops.map((d) => dropHero(d, formatReleaseDate(new Date(d.releaseDate)))),
    cta,
  ];
  return {
    kind: 'CAROUSEL',
    source: { kind: 'manual', slug: `drops-roundup-${new Date(first.releaseDate).toISOString().slice(0, 10)}` },
    caption: CAPTION_TODO,
    scheduledAt: null,
    slides: slides.slice(0, 10),
  };
}

export interface BlogLike {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
}

export function blogStarter(b: BlogLike): DraftSpec {
  return {
    kind: 'CAROUSEL',
    source: { kind: 'blog', slug: b.slug },
    caption: CAPTION_TODO,
    scheduledAt: null,
    slides: [
      { layout: 'photo', kicker: 'New on the blog', title: b.title, image: b.coverImage, altText: `${b.title}, cover image` },
      { layout: 'text', kicker: 'The short version', title: b.title, body: b.excerpt ?? '', altText: b.excerpt ?? b.title },
      { layout: 'cta', title: 'Read the full story', body: `${SITE_HOST}/blogs/${b.slug}`, subtitle: 'Link in bio', altText: 'Link to the full blog post' },
    ],
  };
}

export interface SneakerLike {
  slug: string;
  name: string;
  brand: string;
  tagline?: string;
  releaseYear?: number | null;
  designer?: string;
  originalRetailPrice?: number | null;
  indiaRetailPrice?: number | null;
  sizeNotes?: string;
  image?: string;
}

export function sneakerStarter(s: SneakerLike): DraftSpec {
  const slides: SlideSpec[] = [
    { layout: 'hero', kicker: 'Sneaker guide', brand: s.brand, title: s.name, subtitle: s.tagline ?? '', ghost: ghostWord(s.name), image: s.image, badge: s.releaseYear ? { big: String(s.releaseYear).slice(2), small: ['SINCE', String(s.releaseYear)] } : undefined, altText: altFor(s.name) },
    {
      layout: 'info',
      brand: s.brand,
      title: s.name,
      image: s.image,
      rows: [
        ['First released', s.releaseYear ? String(s.releaseYear) : ''],
        ['Designer', s.designer ?? ''],
        ['India MRP', formatPrice(s.indiaRetailPrice, 'INR') ?? ''],
        ['US retail', formatPrice(s.originalRetailPrice, 'USD')?.replace('US retail ', '') ?? ''],
      ],
      altText: altFor(s.name),
    },
  ];
  if (s.sizeNotes) slides.push({ layout: 'text', kicker: 'Sizing', title: 'How it fits', body: s.sizeNotes, altText: `Sizing notes for the ${s.name}` });
  slides.push({ layout: 'cta', title: 'Full guide', body: `${SITE_HOST}/sneakers/${s.slug}`, subtitle: 'History, India price and sizing', altText: 'Link to the sneaker guide' });
  return { kind: 'CAROUSEL', source: { kind: 'sneaker', slug: s.slug }, caption: CAPTION_TODO, scheduledAt: null, slides };
}

// ─── products in stock ─────────────────────────────────────────────────────

export interface ProductOfferLike {
  size: number | string;
  price: number;
  availability: 'instant' | 'inhand' | 'eta';
}

export interface ProductLike {
  slug: string;
  name: string;
  brand: string;
  colorway?: string;
  images?: string[];
  sku?: string;
  offers: ProductOfferLike[];
}

const SHIP_TEXT: Record<ProductOfferLike['availability'], string> = { instant: 'Ships in 24h', inhand: 'Ships in 3 days', eta: 'Pre-order, about 20 days' };
const AVAIL_ORDER: Record<ProductOfferLike['availability'], number> = { instant: 0, inhand: 1, eta: 2 };

const STYLE_CODE = /^(?:[A-Z]{2}\d{4}-\d{3}|\d{6}-\d{2,3}|[A-Z]{2}\d{4}|\d{4}[A-Z]\d{3}-\d{3}|[MUW]\d{3,4}[A-Z]{2,4}\d?)$/i;

export function styleCode(sku?: string): string {
  const s = (sku ?? '').trim();
  return STYLE_CODE.test(s) ? s.toUpperCase() : '';
}

// "UK 7, 8, 9, 10" for up to 6 sizes, "UK 6 to 11" beyond that.
export function sizeRange(offers: ProductOfferLike[]): string {
  const sizes = [...new Set(offers.map((o) => String(o.size)))];
  const nums = sizes.map(Number);
  if (nums.every((n) => Number.isFinite(n))) {
    const sorted = [...new Set(nums)].sort((a, b) => a - b);
    if (sorted.length === 0) return '';
    if (sorted.length <= 6) return `UK ${sorted.join(', ')}`;
    return `UK ${sorted[0]} to ${sorted[sorted.length - 1]}`;
  }
  return sizes.join(', ');
}

export function productFacts(p: ProductLike): { from: string; sizes: string; ships: string; style: string } {
  const min = Math.min(...p.offers.map((o) => o.price));
  const fastest = [...p.offers].sort((a, b) => AVAIL_ORDER[a.availability] - AVAIL_ORDER[b.availability])[0];
  return {
    from: formatPrice(min, 'INR') ?? '',
    sizes: sizeRange(p.offers),
    ships: fastest ? SHIP_TEXT[fastest.availability] : '',
    style: styleCode(p.sku),
  };
}

function productHero(p: ProductLike, kicker: string): SlideSpec {
  const f = productFacts(p);
  return {
    layout: 'hero',
    kicker,
    brand: p.brand,
    title: stripNickname(p.name),
    subtitle: p.colorway ?? '',
    ghost: ghostWord(p.name),
    image: p.images?.[0],
    badge: { big: f.from, small: ['FROM'], variant: 'price' },
    altText: altFor(p.name, p.colorway),
  };
}

export function productStarter(products: ProductLike[]): DraftSpec {
  const live = products.filter((p) => p.offers.length > 0);
  if (live.length === 0) throw new Error('None of these products has a size in stock');
  const cta = (href: string, title: string): SlideSpec => ({
    layout: 'cta',
    title,
    body: href,
    subtitle: 'Every pair is checked before it ships. Shipping across India.',
    altText: 'Link to shop on SNKRS CART',
  });

  if (live.length === 1) {
    const p = live[0];
    const f = productFacts(p);
    const angles = (p.images ?? []).slice(1, 5).map((src) => ({ layout: 'angle' as const, brand: p.brand, title: stripNickname(p.name), image: src, altText: altFor(p.name, p.colorway) }));
    return {
      kind: 'CAROUSEL',
      source: { kind: 'product', slug: p.slug },
      caption: CAPTION_TODO,
      scheduledAt: null,
      slides: [
        productHero(p, 'In stock'),
        ...angles,
        { layout: 'info' as const, brand: p.brand, title: stripNickname(p.name), image: p.images?.[0], rows: [['Price', `From ${f.from}`], ['Sizes', f.sizes], ['Delivery', f.ships], ['Style', f.style]], altText: altFor(p.name, p.colorway) },
        cta(`${SITE_HOST}/products/${p.slug}`, 'Shop now'),
      ].slice(0, 10),
    };
  }

  const picked = live.slice(0, 6);
  return {
    kind: 'CAROUSEL',
    source: { kind: 'product', slug: picked.map((p) => p.slug).join(',') },
    caption: CAPTION_TODO,
    scheduledAt: null,
    slides: [
      {
        layout: 'schedule' as const,
        kicker: 'Just landed at SNKRS CART',
        title: `${picked.length} new pairs in stock`,
        images: picked.slice(0, 3).map((p) => p.images?.[0] ?? '').filter(Boolean),
        rows: picked.slice(0, 4).map((p) => [productFacts(p).from, p.name, productFacts(p).sizes]),
        altText: `New in stock: ${picked.map((p) => p.name).join(', ')}`,
      },
      ...picked.map((p) => productHero(p, 'New in')),
      cta(`${SITE_HOST}/products`, 'Shop new arrivals'),
    ].slice(0, 10),
  };
}

const BRAND_TAG: Record<string, string> = { nike: '#nike', jordan: '#jordan', 'air jordan': '#airjordan', adidas: '#adidas', 'new balance': '#newbalance', crocs: '#crocs' };

// A facts-only caption for unattended runs: nothing in it that is not in the
// record. A human still approves it, and can rewrite it in the admin panel.
export function autoProductCaption(products: ProductLike[]): string {
  const live = products.filter((p) => p.offers.length > 0);
  const tags = new Set<string>();
  live.forEach((p) => {
    const b = BRAND_TAG[p.brand.toLowerCase()];
    if (b) tags.add(b);
  });
  const model = live.length === 1 ? `#${stripNickname(live[0].name).toLowerCase().replace(/^(nike|adidas|new balance)\s+/, '').replace(/[^a-z0-9]/g, '')}` : '';
  const all = [...tags, model, '#sneakersindia', '#snkrscart'].filter((t) => t && t.length > 2).slice(0, 5);
  if (live.length === 1) {
    const p = live[0];
    const f = productFacts(p);
    return [
      `${p.name} is in stock. From ${f.from}, ${f.sizes}.`,
      '',
      `${f.ships}. Every pair is checked before it ships, anywhere in India. Link in bio.`,
      '',
      all.join(' '),
    ].join('\n');
  }
  const lines = live.slice(0, 6).map((p) => `${p.name}: from ${productFacts(p).from}`);
  return [`${live.length} new pairs just landed.`, '', ...lines, '', 'Every pair is checked before it ships. Link in bio.', '', all.join(' ')].join('\n');
}
