import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from './system-prompt';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Rate limiter: max 15 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; reset: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  if (entry.count >= 15) return true;
  entry.count++;
  return false;
}

// Daily message cap: max 200 messages per IP per day
const dailyMap = new Map<string, { count: number; reset: number }>();
function isDailyCapped(ip: string): boolean {
  const now = Date.now();
  const entry = dailyMap.get(ip);
  if (!entry || now > entry.reset) {
    dailyMap.set(ip, { count: 1, reset: now + 24 * 60 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 200) return true;
  entry.count++;
  return false;
}

// Stop fetching DB context after this many messages — saves tokens on long chats
const CONTEXT_FETCH_LIMIT = 50;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Brand and category alias maps for smarter intent detection
const BRAND_ALIASES: Record<string, string> = {
  'nb': 'New Balance', 'new bal': 'New Balance', 'newbalance': 'New Balance',
  'aj1': 'Jordan', 'aj4': 'Jordan', 'aj11': 'Jordan', 'air jordan': 'Jordan', 'jumpman': 'Jordan',
  'af1': 'Nike', 'air force 1': 'Nike', 'air force one': 'Nike', 'swoosh': 'Nike', 'dunk': 'Nike',
  'yeezy': 'Adidas', 'three stripes': 'Adidas', 'samba': 'Adidas', 'stan smith': 'Adidas', 'campus': 'Adidas',
  'croc': 'Crocs', 'foam clog': 'Crocs', 'clog': 'Crocs',
};
const CATEGORY_ALIASES: Record<string, string> = {
  'running': 'Running', 'jogging': 'Running', 'marathon': 'Running', 'jog': 'Running',
  'basketball': 'Basketball', 'hoops': 'Basketball', 'bball': 'Basketball', 'court': 'Basketball',
  'casual': 'Lifestyle', 'streetwear': 'Lifestyle', 'street': 'Lifestyle', 'everyday': 'Lifestyle',
  'gym': 'Training', 'workout': 'Training', 'crossfit': 'Training', 'training': 'Training',
  'skate': 'Skateboarding', 'skating': 'Skateboarding',
};

// Strip conversational filler — keep only product-relevant terms before hitting the DB
const STOP_WORDS = new Set([
  'do','u','you','we','have','has','is','it','a','an','the','and','or','for',
  'are','can','give','show','me','my','our','any','got','get','buy','what',
  'how','much','want','need','looking','find','like','about','tell','more',
  'check','see','hi','hey','best','good','nice','cool','cheap','price','cost',
]);
function extractProductTerms(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .join(' ')
    .trim();
}

// Pre-sorted alias keys (longest first) — computed once at module level
const SORTED_BRAND_ALIASES = Object.keys(BRAND_ALIASES).sort((a, b) => b.length - a.length);

// Detect brand from query using alias map
function detectBrand(q: string): string | null {
  for (const alias of SORTED_BRAND_ALIASES) {
    if (q.includes(alias)) return BRAND_ALIASES[alias];
  }
  // Direct brand name match
  for (const brand of ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Crocs']) {
    if (q.includes(brand.toLowerCase())) return brand;
  }
  return null;
}

// Detect category intent from query
function detectCategory(q: string): string | null {
  for (const [alias, cat] of Object.entries(CATEGORY_ALIASES)) {
    if (q.includes(alias)) return cat;
  }
  return null;
}

// Detect shoe size from query
function detectSize(q: string): number | null {
  const m = q.match(/\b(?:size|uk|us|eu)\s*(\d{1,2}(?:\.\d)?)\b/) ?? q.match(/\b(\d{1,2}(?:\.\d)?)\s*(?:uk|us|eu)\b/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return n >= 4 && n <= 15 ? n : null;
}

// Detect max price from query
function detectMaxPrice(q: string): number | null {
  const m = q.match(/(?:under|below|budget|max|upto|up to)\s*(?:₹|rs\.?\s*)?(\d+)\s*(?:k|000)?/);
  if (!m) return null;
  const val = parseInt(m[1]);
  return val > 500 ? val : val * 1000;
}

// Detect chip-style intents and map to the right endpoint/params
// entityQuery: cumulative (for brand/size/gender carry-forward)
// searchQuery: last user message only (for exact product name search, uncontaminated by history)
function resolveProductUrl(entityQuery: string, searchQuery: string = entityQuery): string {
  const q = entityQuery.toLowerCase();
  const sq = searchQuery.toLowerCase();

  // Named intent shortcuts — check last message first
  if (/new arrival|new drop|latest drop|just in|just dropped/.test(sq))
    return `${BACKEND_URL}/products/new-arrivals`;
  if (/best seller|bestseller|trending|most popular|top pick/.test(sq))
    return `${BACKEND_URL}/products/trending`;
  if (/coming soon|drop soon/.test(sq))
    return `${BACKEND_URL}/products/coming-soon`;
  if (/gift|present|surprise/.test(sq) && !detectBrand(q) && !detectCategory(q))
    return `${BACKEND_URL}/products/featured`;

  // Entity detection uses cumulative query (carries forward brand/size/gender from earlier turns)
  const params = new URLSearchParams({ limit: '40' });

  const brand = detectBrand(q);
  if (brand) params.set('brand', brand);

  const category = detectCategory(q);
  if (category) params.set('category', category);

  const size = detectSize(q);
  if (size) params.set('size', String(size));

  const maxPrice = detectMaxPrice(q);
  if (maxPrice) { params.set('maxPrice', String(maxPrice)); params.set('sort', 'price_asc'); }

  const gender = /\bwomen\b|\bfemale\b|\bgirl\b|\bher\b|\bwife\b|\bgirlfriend\b/.test(q) ? 'women'
    : /\bmen\b|\bmale\b|\bguy\b|\bboy\b|\bhim\b|\bhusband\b|\bboyfriend\b/.test(q) && !/women/.test(q) ? 'men'
    : null;
  if (gender) params.set('gender', gender);

  if (!/\b(t-?shirt|tee|hoodie|jacket|shorts|trousers|pants|cap|socks|apparel|clothing)\b/.test(q)) {
    params.set('productType', 'shoes');
  }

  // Keyword search uses last message only — avoids polluting specific product searches with history
  const terms = extractSearchTerms(searchQuery, { size, maxPrice });
  if (terms) params.set('search', terms);

  return `${BACKEND_URL}/products?${params}`;
}

const FILTER_WORDS = new Set([
  'under', 'below', 'above', 'over', 'budget', 'max', 'upto', 'around', 'within', 'between', 'rs', 'inr',
  'size', 'sizes', 'uk', 'us', 'eu', 'women', 'womens', 'woman', 'men', 'mens', 'man', 'ladies', 'girl', 'girls', 'boy', 'boys',
  'which', 'that', 'this', 'these', 'those', 'some', 'something', 'anything', 'available', 'stock', 'instock',
  'gift', 'gifting', 'present', 'her', 'him', 'wife', 'husband', 'girlfriend', 'boyfriend', 'friend',
  'shoe', 'shoes', 'sneaker', 'sneakers', 'kicks', 'pair', 'pairs', 'option', 'options', 'please', 'pls',
]);

function extractSearchTerms(text: string, used: { size: number | null; maxPrice: number | null }): string {
  const consumed = new Set<string>();
  if (used.size) consumed.add(String(used.size));
  if (used.maxPrice) { consumed.add(String(used.maxPrice)); consumed.add(String(used.maxPrice / 1000)); }
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 || /^\d$/.test(w))
    .filter((w) => !STOP_WORDS.has(w) && !FILTER_WORDS.has(w) && !consumed.has(w))
    .filter((w) => !/^\d{4,}$/.test(w))
    .join(' ')
    .trim();
}

function productUrlFallbacks(url: string): string[] {
  const u = new URL(url);
  if (!u.pathname.endsWith('/products')) return [url];
  const out = [url];
  const drop = (key: string) => {
    const last = new URL(out[out.length - 1]);
    if (!last.searchParams.has(key)) return;
    last.searchParams.delete(key);
    if (key === 'maxPrice') last.searchParams.delete('sort');
    out.push(last.toString());
  };
  drop('search');
  drop('category');
  drop('size');
  drop('maxPrice');
  return out;
}

// Extract persistent user preferences from full conversation history
function extractPreferences(messages: Message[]): string {
  const userText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join(' ');
  const prefs: string[] = [];

  const gender = /\bwomen\b|\bfemale\b|\bgirl\b/.test(userText) ? 'women'
    : /\bmen\b|\bmale\b|\bguy\b|\bboy\b/.test(userText) && !/women/.test(userText) ? 'men'
    : null;
  if (gender) prefs.push(gender);

  const priceMatch = userText.match(/(?:under|below|budget|max|upto)\s*(?:₹|rs\.?\s*)?(\d+)\s*(?:k|000)?/);
  if (priceMatch) {
    const val = parseInt(priceMatch[1]);
    prefs.push(`under ₹${val > 500 ? val : val * 1000}`);
  }

  const brand = detectBrand(userText);
  if (brand) prefs.push(brand);

  const size = detectSize(userText);
  if (size) prefs.push(`size ${size}`);

  return prefs.join(' ');
}

async function fetchProductContext(entityQuery: string, searchQuery?: string): Promise<string> {
  try {
    let products: any[] = [];
    for (const url of productUrlFallbacks(resolveProductUrl(entityQuery, searchQuery ?? entityQuery))) {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      products = Array.isArray(data) ? data : (data.products ?? []);
      if (Array.isArray(products) && products.length > 0) break;
    }
    if (!Array.isArray(products) || products.length === 0) return '';
    const modelNumbers = (searchQuery ?? entityQuery).match(/\b\d{1,4}\b/g)?.filter((n) => n.length <= 2 || /^(550|574|990|991|992|993|1906|2002|9060|327|530|740|1000|95|97|90|270|720)$/.test(n)) ?? [];
    if (modelNumbers.length) {
      const matched = products.filter((p: any) => modelNumbers.some((n) => new RegExp(`\\b${n}\\b`).test(String(p.name))));
      if (matched.length) products = matched;
    }
    // TOON format: one header + pipe-separated rows — saves ~40% tokens vs key:value per row
    const header = 'name|brand|price|origPrice|inStock|category|gender|sizes|rating|tags|slug';
    const rows = products.map((p: any) => {
      const sizes = (p.availableSizes ?? p.sizes ?? []).join(' ');
      const disc = p.discount ? `${p.discount}%off` : '';
      const origPrice = p.originalPrice ? `₹${p.originalPrice}` : '-';
      const inStock = (p.availableSizes ?? p.sizes ?? []).length > 0 ? 'yes' : 'no';
      const category = p.category || '-';
      const rating = p.rating ? p.rating.toFixed(1) : '-';
      const tags = (p.tags ?? []).slice(0, 3).join(' ') || '-';
      const priceField = disc ? `₹${p.price}(${disc})` : `₹${p.price}`;
      return `${p.name}|${p.brand}|${priceField}|${origPrice}|${inStock}|${category}|${p.gender}|${sizes}|${rating}|${tags}|${p.slug}`;
    });
    return [header, ...rows].join('\n');
  } catch {
    return '';
  }
}

interface CatalogEntry { name: string; prices: string[]; slug: string }

function parseCatalog(context: string): CatalogEntry[] {
  if (!context) return [];
  return context
    .split('\n')
    .slice(1)
    .map((row) => row.split('|'))
    .filter((cols) => cols.length >= 11)
    .map((cols) => ({
      name: cols[0].trim(),
      prices: [cols[2].split('(')[0], cols[3]].map((p) => p.replace(/[^\d]/g, '')).filter(Boolean),
      slug: cols[cols.length - 1].trim(),
    }));
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[‘’'"`’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

const PRODUCT_LIKE = /\b(nike|jordan|adidas|new balance|crocs|air|dunk|yeezy|samba|retro|force|max|puma|asics|reebok|vans|converse)\b/i;

function findUngroundedClaims(text: string, catalog: CatalogEntry[], userText: string): string[] {
  const names = catalog.map((c) => normalizeName(c.name));
  const prices = new Set(catalog.flatMap((c) => c.prices));
  for (const m of userText.matchAll(/(\d[\d,]{2,})\s*(k)?/gi)) {
    const n = m[1].replace(/,/g, '');
    prices.add(m[2] ? String(parseInt(n) * 1000) : n);
  }
  const flagged: string[] = [];
  for (const bold of text.matchAll(/\*\*([^*\n]{4,80})\*\*/g)) {
    if (!PRODUCT_LIKE.test(bold[1])) continue;
    const claim = normalizeName(bold[1].replace(/\s[—–-]\s.*$/, ''));
    if (claim.length < 6) continue;
    const grounded = names.some((n) => n.includes(claim) || claim.includes(n) || sharesHead(n, claim));
    if (!grounded) flagged.push(bold[1]);
  }
  for (const m of text.matchAll(/₹\s?([\d,]{4,})/g)) {
    const p = m[1].replace(/,/g, '');
    if (!prices.has(p)) flagged.push(`₹${m[1]}`);
  }
  return flagged;
}

function sharesHead(a: string, b: string): boolean {
  const wa = a.split(' ').slice(0, 4).join(' ');
  const wb = b.split(' ').slice(0, 4).join(' ');
  return wa.length >= 12 && wa === wb;
}

const NVIDIA_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    product_slugs: { type: 'array', items: { type: 'string' } },
    blog_slugs: { type: 'array', items: { type: 'string' } },
  },
  required: ['reply', 'product_slugs', 'blog_slugs'],
  additionalProperties: false,
};

const STRUCTURED_NOTE = `\n\n━━━ OUTPUT FORMAT ━━━\nRespond with a JSON object: "reply" is the conversational message for the user (no [S:] or [BS:] tags inside it), "product_slugs" lists the exact catalog slugs of every product you mention or recommend, "blog_slugs" lists exact blog slugs from the blog context. Use only slugs that appear in the context above. Empty arrays when nothing applies.`;

async function lookupOrder(text: string): Promise<any | null> {
  const orderMatch = text.match(/SC-[A-Z0-9]+-[A-Z0-9]+/i);
  if (!orderMatch) return null;
  const orderNumber = orderMatch[0].toUpperCase();
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+91|91)?[6-9]\d{9}/);
  if (!emailMatch && !phoneMatch) return null;
  try {
    const params = new URLSearchParams({ orderNumber });
    if (emailMatch) params.set('email', emailMatch[0]);
    else if (phoneMatch) params.set('phone', phoneMatch[0]);
    const res = await fetch(`${BACKEND_URL}/orders/lookup?${params}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchSuggestedProducts(slugs: string[]): Promise<any[]> {
  if (!slugs.length) return [];
  const results = await Promise.allSettled(
    slugs.map((slug) =>
      fetch(`${BACKEND_URL}/products/${slug}`, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : null
      )
    )
  );
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => (r as PromiseFulfilledResult<any>).value);
}

async function fetchBlogContext(query: string): Promise<string> {
  try {
    // Server-side search — no longer fetches all blogs
    const params = new URLSearchParams({ search: extractProductTerms(query) || query, limit: '5' });
    const res = await fetch(`${BACKEND_URL}/blogs?${params}`, { cache: 'no-store' });
    if (!res.ok) return '';
    const payload = await res.json();
    const blogs: any[] = Array.isArray(payload) ? payload : (payload.blogs ?? []);
    if (!Array.isArray(blogs) || blogs.length === 0) return '';
    const header = 'title|tags|slug';
    const rows = blogs.map((b: any) => `${b.title}|${(b.tags ?? []).join(' ')}|${b.slug}`);
    return [header, ...rows].join('\n');
  } catch {
    return '';
  }
}

async function fetchSuggestedBlogs(slugs: string[]): Promise<any[]> {
  if (!slugs.length) return [];
  const results = await Promise.allSettled(
    slugs.map((slug) =>
      fetch(`${BACKEND_URL}/blogs/${slug}`, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : null
      )
    )
  );
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => (r as PromiseFulfilledResult<any>).value);
}

async function fetchDropContext(query: string): Promise<string> {
  const q = query.toLowerCase();
  if (!/drop|release|launch|upcoming|calendar|when.*cop|restoc|june|july|aug|may|20\d{2}/.test(q)) return '';
  try {
    const res = await fetch(`${BACKEND_URL}/drops`, { cache: 'no-store' });
    if (!res.ok) return '';
    const drops: any[] = await res.json();
    if (!drops.length) return '';
    const header = 'name|brand|date|price|where|slug';
    const rows = drops.slice(0, 10).map((d: any) => {
      const date = new Date(d.releaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const price = d.retailPrice ? `₹${d.retailPrice.toLocaleString('en-IN')}` : 'TBA';
      return `${d.name}|${d.brand}|${date}|${price}|${d.where}|${d.slug}`;
    });
    return [header, ...rows].join('\n');
  } catch { return ''; }
}

// Patterns that indicate prompt injection attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a\s+)?/i,
  /act\s+as\s+(a\s+)?/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /forget\s+(everything|all|your)\s+(you|above|previous)/i,
  /system\s*prompt/i,
  /jailbreak/i,
  /do\s+anything\s+now/i,
  /dan\s+mode/i,
  /override\s+(your\s+)?(instructions?|rules?)/i,
];

function sanitizeInput(text: string): string {
  // Trim and cap length to prevent token flooding
  return text.trim().slice(0, 500);
}

function isInjectionAttempt(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

const BUSY_MSG_EN = { text: "KickBot is slammed right now — try again in a bit! 🙏👟", products: [] };
const RATE_MSG_EN = { text: "Slow down! 😅 Give me a minute — you're sending too many messages.", products: [] };


export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY && !process.env.NVIDIA_API_KEY) {
    console.error('No AI API key set');
    return NextResponse.json(BUSY_MSG_EN);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(RATE_MSG_EN);
  }
  if (isDailyCapped(ip)) {
    return NextResponse.json({
      text: "You've reached today's chat limit! 🙏 You're in the queue — come back tomorrow and KickBot will be ready for you. Meanwhile, browse our drops! 👟",
      products: [],
    });
  }

  let messages: Message[] = [];

  try {
    ({ messages } = await req.json() as { messages: Message[] });
    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const raw = messages.findLast((m) => m.role === 'user')?.content ?? '';
    const lastUserMessage = sanitizeInput(raw);

    if (isInjectionAttempt(lastUserMessage)) {
      return NextResponse.json({
        text: "Just ask me about sneakers! What kicks are you looking for? 👟",
        products: [],
      });
    }

    // Order lookup — only when message mentions order intent
    const isOrderQuery = /order|delivered|shipped|tracking|dispatch/i.test(lastUserMessage);
    if (isOrderQuery) {
      const hasOrderNum = /SC-[A-Z0-9]+-[A-Z0-9]+/i.test(lastUserMessage);
      if (hasOrderNum) {
        // Scope to last 3 messages to avoid stale email/phone from earlier turns
        const recentUserText = messages.filter((m) => m.role === 'user').slice(-3).map((m) => m.content).join(' ');
        const order = await lookupOrder(recentUserText);
        if (order) {
          const statusLabel: Record<string, string> = {
            pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped',
            delivered: 'Delivered', cancelled: 'Cancelled',
          };
          const productNames = (order.items as any[])?.map((i) => i.name).join(', ') ?? 'N/A';
          const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          return NextResponse.json({
            text: `Here are the details for order **#${order.orderNumber}**:`,
            products: [],
            order: {
              _id: order._id,
              orderNumber: order.orderNumber,
              status: statusLabel[order.status] ?? order.status,
              productNames,
              orderDate,
              trackingNumber: order.trackingNumber || null,
              total: order.total,
            },
          });
        }
        // SC- number found but email/phone didn't match
        return NextResponse.json({
          text: "I couldn't find that order. Please check your order number and make sure you're using the email or phone from when you ordered. 📦",
          products: [],
        });
      }
      // Order intent but no SC- number — prompt for it
      return NextResponse.json({
        text: "To look up your order, share your order number (starts with SC-) along with your registered email or phone number. 📦",
        products: [],
      });
    }
    // Skip DB/API context fetches on long conversations to save tokens
    const userMessageCount = messages.filter((m) => m.role === 'user').length;
    const skipContext = userMessageCount > CONTEXT_FETCH_LIMIT;

    // Accumulate last 3 user messages + persistent preferences (brand, gender, size, budget)
    // so narrowing queries ("show running ones") carry forward earlier context.
    const cumulativeQuery = [
      ...messages.filter((m) => m.role === 'user').slice(-3).map((m) => m.content),
      extractPreferences(messages),
    ].join(' ').trim();

    const [productContext, blogContext, dropContext] = await Promise.all([
      fetchProductContext(cumulativeQuery, lastUserMessage),
      skipContext ? '' : fetchBlogContext(lastUserMessage),
      skipContext ? '' : fetchDropContext(cumulativeQuery),
    ]);

    const catalog = parseCatalog(productContext);
    const allowedBlogSlugs = new Set(blogContext.split('\n').slice(1).map((row) => row.split('|').pop() ?? '').filter(Boolean));

    let systemWithContext = SYSTEM_PROMPT;
    systemWithContext += productContext
      ? `\n\n--- AVAILABLE PRODUCTS ---\n${productContext}\n--- END PRODUCTS ---`
      : `\n\n--- AVAILABLE PRODUCTS ---\n(none matched this query. Do not name, describe or price any product. Say nothing matched and point to https://www.snkrscart.com/products)\n--- END PRODUCTS ---`;
    if (blogContext) systemWithContext += `\n\n--- RELEVANT BLOG ARTICLES ---\n${blogContext}\n--- END BLOGS ---`;
    if (dropContext) systemWithContext += `\n\n--- UPCOMING DROPS (release calendar) ---\n${dropContext}\n--- END DROPS ---`;

    let rawText = '';

    // Keep last 20 messages as full context, sanitizing user messages
    const historyMessages = messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.role === 'user' ? sanitizeInput(m.content) : m.content,
    }));

    // Compress older messages into a summary prepended to the system prompt
    const olderMessages = messages.slice(0, -20);
    if (olderMessages.length > 0) {
      const summary = olderMessages
        .map((m) => `${m.role === 'user' ? 'Customer' : 'KickBot'}: ${m.content.slice(0, 200)}`)
        .join('\n');
      systemWithContext = `[Earlier conversation]\n${summary}\n\n[Recent conversation — continue from here]\n\n${systemWithContext}`;
    }

    // Primary: Gemini — pass full conversation history
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const geminiContents = historyMessages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));
        const result = await ai.models.generateContent({
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
          contents: geminiContents,
          config: { systemInstruction: systemWithContext },
        });
        rawText = result.text ?? '';
      } catch (geminiErr: any) {
        console.warn('Gemini failed, falling back to Groq:', geminiErr?.message);
      }
    }

    // Fallback: Groq — pass full conversation history
    if (!rawText && process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const result = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemWithContext },
            ...historyMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          ],
          max_tokens: 512,
        });
        rawText = result.choices[0]?.message?.content ?? '';
      } catch (groqErr: any) {
        console.warn('Groq failed, falling back to NVIDIA:', groqErr?.message);
      }
    }

    let structured: { reply: string; product_slugs: string[]; blog_slugs: string[] } | null = null;

    // Fallback 2: NVIDIA NIM — cycle through free models until one responds
    if (!rawText && process.env.NVIDIA_API_KEY) {
      const NVIDIA_MODELS: Array<{ model: string; extra: Record<string, unknown> }> = [
        { model: 'nvidia/nemotron-3-super-120b-a12b', extra: { chat_template_kwargs: { enable_thinking: false } } },
        { model: 'openai/gpt-oss-20b', extra: { reasoning_effort: 'low' } },
      ];
      for (const { model, extra } of NVIDIA_MODELS) {
        if (rawText) break;
        try {
          const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemWithContext + STRUCTURED_NOTE },
                ...historyMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
              ],
              max_tokens: 600,
              temperature: 0.3,
              response_format: { type: 'json_schema', json_schema: { name: 'kickbot_reply', strict: true, schema: NVIDIA_SCHEMA } },
              ...extra,
            }),
            signal: AbortSignal.timeout(20_000),
          });
          const data = await res.json();
          if (!res.ok) {
            console.warn(`NVIDIA NIM [${model}] HTTP ${res.status}:`, JSON.stringify(data).slice(0, 200));
            continue;
          }
          const content: string = data.choices?.[0]?.message?.content ?? '';
          try {
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed.reply === 'string') {
              structured = {
                reply: parsed.reply,
                product_slugs: Array.isArray(parsed.product_slugs) ? parsed.product_slugs.map(String) : [],
                blog_slugs: Array.isArray(parsed.blog_slugs) ? parsed.blog_slugs.map(String) : [],
              };
              rawText = parsed.reply;
            }
          } catch {
            rawText = content;
          }
        } catch (nvidiaErr: any) {
          console.warn(`NVIDIA NIM [${model}] failed:`, nvidiaErr?.message);
        }
      }
    }

    if (!rawText) {
      console.error('KickBot: every provider returned empty text');
      return NextResponse.json(
        { text: "I'm having trouble connecting right now. Try again in a minute, or WhatsApp us from the green button.", products: [], blogs: [] },
        { status: 503 },
      );
    }

    // Parse compact TOON tags: [S:slug-1,slug-2] and [BS:slug-1]
    // Also accept legacy JSON format as fallback
    const suggestionMatch = rawText.match(/\[S:([\w,\-]+)\]/) ?? rawText.match(/\[SUGGESTIONS:\s*(\{[\s\S]*?\})\s*\]?/);
    const blogMatch = rawText.match(/\[BS:([\w,\-]+)\]/) ?? rawText.match(/\[BLOG_SUGGESTIONS:\s*(\{[\s\S]*?\})\s*\]?/);
    let suggestedProducts: any[] = [];
    let suggestedBlogs: any[] = [];
    let displayText = rawText;
    let productSlugs: string[] = structured?.product_slugs ?? [];
    let blogSlugs: string[] = structured?.blog_slugs ?? [];

    if (suggestionMatch) {
      displayText = displayText.replace(suggestionMatch[0], '').trim();
      try {
        const matched = suggestionMatch[1];
        productSlugs = matched.startsWith('{') ? JSON.parse(matched).slugs : matched.split(',').map((s: string) => s.trim()).filter(Boolean);
      } catch {}
    }

    if (blogMatch) {
      displayText = displayText.replace(blogMatch[0], '').trim();
      try {
        const matched = blogMatch[1];
        blogSlugs = matched.startsWith('{') ? JSON.parse(matched).slugs : matched.split(',').map((s: string) => s.trim()).filter(Boolean);
      } catch {}
    }

    const allowedProductSlugs = new Set(catalog.map((c) => c.slug));
    const droppedProducts = productSlugs.filter((s) => !allowedProductSlugs.has(s));
    const droppedBlogs = blogSlugs.filter((s) => !allowedBlogSlugs.has(s));
    productSlugs = productSlugs.filter((s) => allowedProductSlugs.has(s)).slice(0, 6);
    blogSlugs = blogSlugs.filter((s) => allowedBlogSlugs.has(s)).slice(0, 3);
    if (droppedProducts.length || droppedBlogs.length) {
      console.warn('KickBot dropped ungrounded slugs:', { products: droppedProducts, blogs: droppedBlogs });
    }
    let forcedGrounding = false;
    if (!productSlugs.length && droppedProducts.length && catalog.length) {
      productSlugs = catalog.slice(0, 3).map((c) => c.slug);
      forcedGrounding = true;
    }

    // Safety net: strip any leftover tags
    displayText = displayText
      .replace(/\[S:[\s\S]*/g, '')
      .replace(/\[BS:[\s\S]*/g, '')
      .replace(/\[SUGGESTIONS:[\s\S]*/g, '')
      .replace(/\[BLOG_SUGGESTIONS:[\s\S]*/g, '')
      .replace(/["}\]]+\s*$/, '')
      .trim();

    const ungrounded = findUngroundedClaims(displayText, catalog, cumulativeQuery);
    if (ungrounded.length || forcedGrounding) {
      if (ungrounded.length) console.warn('KickBot ungrounded claims:', ungrounded);
      displayText = productSlugs.length
        ? "Here's what we actually have in stock that matches — tap a card for sizes and the exact price:"
        : catalog.length
          ? "I couldn't find an exact match for that in our current stock. Browse everything at https://www.snkrscart.com/products or tell me a brand, budget or size and I'll narrow it down. 👟"
          : "Nothing matched that right now. Browse at https://www.snkrscart.com/products or give me a brand, budget or size to search. 👟";
    }

    [suggestedProducts, suggestedBlogs] = await Promise.all([
      fetchSuggestedProducts(productSlugs),
      fetchSuggestedBlogs(blogSlugs),
    ]);

    return NextResponse.json({ text: displayText, products: suggestedProducts, blogs: suggestedBlogs });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('Chat API error (full):', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      return NextResponse.json(RATE_MSG_EN);
    }
    return NextResponse.json(BUSY_MSG_EN);
  }
}
