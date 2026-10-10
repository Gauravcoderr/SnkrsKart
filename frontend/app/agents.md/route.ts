import { NextResponse } from 'next/server';
import { SITE_URL, STORE_FACTS } from '@/lib/storeFacts';

const f = STORE_FACTS;

const body = `# SNKRS CART: guide for AI agents

${f.name} (${f.url}) sells ${f.catalogue.charAt(0).toLowerCase()}${f.catalogue.slice(1)} ${f.market} ${f.sizing}

## MCP server

- Endpoint: ${SITE_URL}/mcp (Streamable HTTP, stateless, no auth, read-only)
- \`search_products\`: find pairs by words, brand, UK size, max price
- \`get_product\`: one product with every size, INR price, stock, dispatch time and delivery estimate
- \`build_cart_link\`: checks sizes and returns a link that opens the bag on snkrscart.com
- \`get_upcoming_drops\`: upcoming releases with date, IST launch time, style code and retail price
- \`get_store_policies\`: shipping, returns, authenticity, payment, contact

## Buying for a person

1. Find the pair and size with the MCP tools or the product page.
2. Give the buyer a cart link: \`${SITE_URL}/cart/add?items=<product-slug>:<uk-size>[:<qty>]\`, several pairs comma separated.
3. The buyer reviews the bag, verifies their email with an OTP and pays on snkrscart.com.

Agents cannot place, reserve or pay for orders. Never tell a buyer an order was placed.

## Product pages

- \`${SITE_URL}/products/<slug>\` is server rendered. \`?size=<uk-size>\` preselects that size.
- JSON-LD: ProductGroup with one variant per size (offer price in INR, availability, dispatch time), the manufacturer style code as \`mpn\`.
- Per-size Google Merchant feed: ${SITE_URL}/google-merchant-feed.xml
- Sitemap: ${SITE_URL}/sitemap.xml, summary: ${SITE_URL}/llms.txt

## Policies

- Shipping: India only, free on every order. ${f.shipping.dispatch.instant}, ${f.shipping.dispatch.inhand.toLowerCase()} or ${f.shipping.dispatch.preorder.toLowerCase()} (pre-order sizes), as shown per size. Delivery ${f.shipping.delivery_after_dispatch} after dispatch.
- Returns: ${f.returns}
- Authenticity: ${f.authenticity}
- Payment: ${f.payment}
- Details: ${f.pages.shipping}, ${f.pages.returns}, ${f.pages.faqs}
- Contact: ${f.contact.email}, ${f.contact.phone}
`;

export function GET() {
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
