import { createMcpHandler } from 'mcp-handler';
import { originValidationResponse } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { fetchAllProducts, type CatalogProduct } from '@/lib/catalog';
import { fetchDrops, fetchProductBySlug, NotFoundError } from '@/lib/api';
import { fullProductName } from '@/lib/productTitle';
import { AVAILABILITY_META, formatDeliveryWindow } from '@/lib/availability';
import { stockState, validMpn, variants, type Variant, type VariantOffer } from '@/lib/merchantFacts';
import { buyableSize, cartEntry, cartLink, MAX_CART_LINK_ITEMS } from '@/lib/cartLink';
import { isLive, matchSameProduct } from '@/lib/productMatch';
import { SITE_URL, STORE_FACTS } from '@/lib/storeFacts';
import type { Product } from '@/types';

// Remote MCP server for AI shopping agents (ChatGPT, Claude, Gemini, Perplexity...).
// Read-only: catalogue, sizes, drops, policies and a cart link the buyer opens to check out.
// No customer data, no orders.

export const dynamic = 'force-dynamic';
// Render free tier sleeps; first fetch after idle can take 30-50s.
export const maxDuration = 60;

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

type Sizable = Pick<Product, 'slug' | 'productType' | 'sizes' | 'availableSizes' | 'stringSizes' | 'availableStringSizes' | 'offers' | 'comingSoon' | 'soldOut'>;

function plainText(html: string, max: number): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, max);
}

function sizeFacts(p: Sizable, v: Variant<VariantOffer>) {
  const state = stockState(p, v);
  const buyable = state === 'in stock' || state === 'backorder';
  return {
    size: v.size,
    ...(v.isShoe && { size_system: 'UK' }),
    availability: state,
    ...(buyable && v.offer && {
      price_inr: v.offer.price,
      ships: AVAILABILITY_META[v.offer.availability].description,
      delivery_estimate: formatDeliveryWindow(v.offer.availability),
    }),
  };
}

function summary(p: CatalogProduct) {
  const sized = variants(p as Sizable).filter((v) => v.size);
  const inStock = sized.filter((v) => ['in stock', 'backorder'].includes(stockState(p, v)));
  const prices = inStock.map((v) => v.offer?.price ?? p.price);
  return {
    name: fullProductName(p.brand, p.name),
    brand: p.brand,
    colorway: p.colorway || undefined,
    style_code: validMpn(p.sku) ?? undefined,
    slug: p.slug,
    url: `${SITE_URL}/products/${p.slug}`,
    image: p.images?.[0],
    price_from_inr: prices.length ? Math.min(...prices) : p.price,
    status: p.comingSoon ? 'coming soon' : inStock.length ? 'in stock' : 'sold out',
    sizes_in_stock: inStock.map((v) => v.size),
    ...(p.reviewCount ? { rating: p.rating, review_count: p.reviewCount } : {}),
  };
}

/** Numbers match whole words ("1" never matches "12"); other words match at a word start. */
function matchesWord(hay: string, word: string): boolean {
  const w = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(/^\d+(\.\d+)?$/.test(word) ? `(^|[^a-z0-9.])${w}($|[^a-z0-9.])` : `(^|[^a-z0-9])${w}`).test(hay);
}

function json(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

function failure(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

const UNAVAILABLE = 'The SNKRS CART catalogue is waking up or temporarily unavailable. Retry in about a minute.';

const handler = createMcpHandler((server) => {
  server.registerTool(
    'search_products',
    {
      title: 'Search SNKRS CART sneakers',
      description: 'Search the SNKRS CART catalogue (authentic sneakers sold in India, prices in INR, UK sizes). Matches words in the name, colourway and style code. Returns in-stock items first. Use get_product for exact per-size prices before quoting them.',
      inputSchema: z.object({
        query: z.string().max(100).optional().describe('Words to match, e.g. "jordan 1 royal", "samba", "FD1437-005"'),
        brand: z.enum(['Nike', 'Jordan', 'Adidas', 'New Balance', 'Crocs']).optional(),
        size_uk: z.string().max(5).optional().describe('Only items buyable in this UK size, e.g. "9" or "8.5"'),
        max_price_inr: z.number().positive().optional(),
        gender: z.enum(['men', 'women', 'unisex', 'kids']).optional(),
        include_sold_out: z.boolean().optional().describe('Default false'),
        limit: z.number().int().min(1).max(20).optional().describe('Default 8'),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, brand, size_uk, max_price_inr, gender, include_sold_out, limit }) => {
      const catalogue = await fetchAllProducts({ revalidate: 600 }).catch(() => []);
      if (catalogue.length === 0) return failure(UNAVAILABLE);
      const words = (query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
      const wantedSize = size_uk?.trim().toLowerCase().replace(/^uk\s*/, '');
      const results = catalogue
        .filter((p) => !brand || p.brand.toLowerCase() === brand.toLowerCase() || p.brand.toLowerCase().startsWith(`${brand.toLowerCase()} `))
        .filter((p) => !gender || p.gender === gender)
        .filter((p) => {
          const hay = [p.brand, p.name, p.colorway, p.sku, ...(p.tags ?? [])].join(' ').toLowerCase();
          return words.every((w) => matchesWord(hay, w));
        })
        .map((p) => {
          const s = summary(p);
          const v = wantedSize
            ? variants(p as Sizable).find((x) => x.size?.toLowerCase() === wantedSize && ['in stock', 'backorder'].includes(stockState(p, x)))
            : undefined;
          return { s, sizePrice: v ? v.offer?.price ?? p.price : undefined };
        })
        .filter(({ sizePrice }) => !wantedSize || sizePrice !== undefined)
        .filter(({ s, sizePrice }) => !max_price_inr || (sizePrice ?? s.price_from_inr) <= max_price_inr)
        .filter(({ s }) => include_sold_out || s.status !== 'sold out')
        .sort((a, b) => Number(b.s.status === 'in stock') - Number(a.s.status === 'in stock') || a.s.price_from_inr - b.s.price_from_inr)
        .slice(0, limit ?? 8)
        .map(({ s, sizePrice }) => (sizePrice !== undefined ? { ...s, requested_size_price_inr: sizePrice } : s));
      return json({ count: results.length, results, note: 'Prices in INR. Sizes are UK. Stock changes fast: confirm with get_product.' });
    },
  );

  server.registerTool(
    'get_product',
    {
      title: 'Get a SNKRS CART product with live sizes',
      description: 'Full details for one product by slug: style code, colourway, description, rating, and every size with availability, INR price, dispatch time and delivery estimate.',
      inputSchema: z.object({
        slug: z.string().regex(/^[a-z0-9-]{1,160}$/).describe('Product slug from search_products or a snkrscart.com/products/<slug> URL'),
      }),
      annotations: READ_ONLY,
    },
    async ({ slug }) => {
      let p: Product;
      try {
        p = await fetchProductBySlug(slug);
      } catch (e) {
        return e instanceof NotFoundError ? failure(`No product with slug "${slug}".`) : failure(UNAVAILABLE);
      }
      return json({
        name: fullProductName(p.brand, p.name),
        brand: p.brand,
        colorway: p.colorway || undefined,
        style_code: validMpn(p.sku) ?? undefined,
        condition: 'new',
        url: `${SITE_URL}/products/${p.slug}`,
        images: (p.images ?? []).slice(0, 4),
        description: plainText(p.description ?? '', 1500),
        status: p.comingSoon ? 'coming soon' : p.soldOut ? 'sold out' : 'available',
        ...(p.reviewCount ? { rating: p.rating, review_count: p.reviewCount } : {}),
        sizes: variants(p).filter((v) => v.size).map((v) => sizeFacts(p, v)),
        authenticity: STORE_FACTS.authenticity,
        shipping: 'Free shipping across India on every order.',
        returns: STORE_FACTS.returns,
        how_to_buy: 'Call build_cart_link with this slug and a size, then give the buyer the link.',
      });
    },
  );

  server.registerTool(
    'build_cart_link',
    {
      title: 'Build a SNKRS CART bag link',
      description: 'Checks that each pair is buyable in the given UK size and returns a link that opens snkrscart.com with those pairs in the bag. The buyer reviews the bag and checks out themselves (email OTP, UPI). Nothing is reserved or ordered by this tool.',
      inputSchema: z.object({
        items: z.array(z.object({
          slug: z.string().regex(/^[a-z0-9-]{1,160}$/),
          size_uk: z.string().max(10).describe('UK size, e.g. "9"; for clothing the size label, e.g. "M"'),
          quantity: z.number().int().min(1).max(5).optional(),
        })).min(1).max(MAX_CART_LINK_ITEMS),
      }),
      annotations: READ_ONLY,
    },
    async ({ items }) => {
      const checked = await Promise.all(items.map(async (i) => {
        try {
          const p = await fetchProductBySlug(i.slug);
          const size = buyableSize(p, i.size_uk);
          if (size === undefined) return { slug: i.slug, size: i.size_uk, ok: false, reason: 'Not available in this size right now' };
          const { product } = cartEntry(p, size);
          return { slug: p.slug, size: String(size), quantity: i.quantity ?? 1, ok: true, name: fullProductName(p.brand, p.name), price_inr: product.price };
        } catch (e) {
          return { slug: i.slug, size: i.size_uk, ok: false, reason: e instanceof NotFoundError ? 'Product not found' : 'Store temporarily unavailable, retry' };
        }
      }));
      const ok = checked.filter((c) => c.ok);
      if (ok.length === 0) return json({ cart_url: null, items: checked });
      const subtotal = ok.reduce((n, c) => n + (c.price_inr ?? 0) * (c.quantity ?? 1), 0);
      return json({
        cart_url: cartLink(ok.map((c) => ({ slug: c.slug, size: c.size, quantity: c.quantity ?? 1 }))),
        items: checked,
        subtotal_inr: subtotal,
        shipping_inr: STORE_FACTS.shipping.fee_inr,
        note: 'Give this link to the buyer. They pay on snkrscart.com; prices are confirmed at checkout.',
      });
    },
  );

  server.registerTool(
    'get_upcoming_drops',
    {
      title: 'Upcoming sneaker releases',
      description: 'Upcoming and recent sneaker releases tracked by SNKRS CART, with release date, IST launch time, style code, retail price and whether SNKRS CART sells the pair.',
      inputSchema: z.object({
        brand: z.string().max(30).optional(),
        include_recent_days: z.number().int().min(0).max(90).optional().describe('Also include releases from the last N days (default 0)'),
        limit: z.number().int().min(1).max(30).optional().describe('Default 15'),
      }),
      annotations: READ_ONLY,
    },
    async ({ brand, include_recent_days, limit }) => {
      const days = include_recent_days ?? 0;
      const [drops, catalogue] = await Promise.all([
        fetchDrops(Math.max(days, 1)).catch(() => null),
        fetchAllProducts({ revalidate: 600 }).catch(() => []),
      ]);
      if (!drops) return failure(UNAVAILABLE);
      // Same drop-to-product link as the drop page: admin productSlug, else the same-shoe matcher.
      const productFor = (d: (typeof drops)[number]) => (d.productSlug
        ? catalogue.find((p) => p.slug === d.productSlug)
        : matchSameProduct({ brand: d.brand, name: d.name, colorway: d.colorway, styleCode: d.styleCode }, catalogue)) ?? null;
      const from = Date.now() - days * 86_400_000 - 86_400_000;
      const list = drops
        .filter((d) => new Date(d.releaseDate).getTime() >= from)
        .filter((d) => !brand || d.brand.toLowerCase().includes(brand.toLowerCase()))
        .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())
        .slice(0, limit ?? 15)
        .map((d) => ({ d, product: productFor(d) }))
        .map(({ d, product }) => ({
          name: d.name,
          brand: d.brand,
          colorway: d.colorway || undefined,
          style_code: d.styleCode || undefined,
          release_date: d.releaseDate.slice(0, 10),
          ...(d.launchTimeIST && { launch_time_ist: d.launchTimeIST }),
          ...(d.retailPrice && { retail_price: { amount: d.retailPrice, currency: d.currency } }),
          where: d.where || undefined,
          sold_by_snkrs_cart: d.availableAtStore || Boolean(product && isLive(product)),
          ...(product && { product_url: `${SITE_URL}/products/${product.slug}` }),
          url: `${SITE_URL}/drops/${d.slug}`,
        }));
      return json({ count: list.length, drops: list });
    },
  );

  server.registerTool(
    'get_store_policies',
    {
      title: 'SNKRS CART store policies',
      description: 'Shipping cost and times, returns, authenticity checks, payment methods, checkout and contact for SNKRS CART.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => json(STORE_FACTS),
  );
}, {
  serverInfo: { name: 'snkrs-cart', version: '1.0.0' },
  instructions: 'SNKRS CART sells new, authentic sneakers in India (INR, UK sizes). Use search_products to find pairs, get_product for exact per-size prices and stock, and build_cart_link to hand the buyer a filled bag. The buyer always checks out and pays on snkrscart.com; never say an order was placed.',
});

// MCP 2026-07-28: reject browser requests from unknown origins (DNS rebinding). Server-side
// agent clients send no Origin and pass.
const ALLOWED_ORIGIN_HOSTS = ['www.snkrscart.com', 'snkrscart.com', 'claude.ai', 'chatgpt.com', 'chat.openai.com', 'localhost', '127.0.0.1'];

async function guarded(request: Request): Promise<Response> {
  return originValidationResponse(request, ALLOWED_ORIGIN_HOSTS) ?? handler(request);
}

export { guarded as GET, guarded as POST, guarded as DELETE };
