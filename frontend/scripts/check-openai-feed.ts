// Run: cd frontend && NEXT_PUBLIC_API_URL=https://api.snkrscart.com/api/v1 npx --yes tsx --tsconfig tsconfig.json scripts/check-openai-feed.ts
// Spec: https://developers.openai.com/commerce/specs/file-upload/products

import { fetchAllProducts, type CatalogProduct } from '@/lib/catalog';
import { OPENAI_FEED_COLUMNS, openaiFeedRows, toCsv, toJsonl, type OpenAIFeedRow } from '@/lib/openaiFeed';

const REQUIRED = ['item_id', 'title', 'description', 'url', 'brand', 'seller_name', 'image_url', 'availability', 'price'] as const;
const ALWAYS_SENT = ['seller_url', 'return_policy', 'condition', 'product_category', 'gender', 'age_group', 'shipping_price'] as const;
const AVAILABILITY = new Set(['in_stock', 'out_of_stock', 'pre_order', 'backorder', 'unknown']);
const MONEY_INR = /^\d+\.\d{2} INR$/;
const PLACEHOLDER = /^(null|unknown|n\/a|none|undefined)$/i;
const HTTPS = /^https:\/\/\S+$/;
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
const FETCH_TIMEOUT_MS = 60_000;
const DETAIL_LINES = 50;

function expectedRowCount(p: CatalogProduct): number {
  const isShoe = (p.productType ?? 'shoes') === 'shoes';
  const sizes = isShoe ? p.sizes?.length || p.availableSizes.length : p.stringSizes?.length || p.availableStringSizes?.length || 0;
  return sizes || 1;
}

function parseCsv(text: string): string[][] {
  const records: string[][] = [];
  let cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      cells.push(cell);
      cell = '';
    } else if (c === '\n') {
      cells.push(cell);
      records.push(cells);
      cells = [];
      cell = '';
    } else if (c !== '\r') cell += c;
  }
  if (cell.length || cells.length) {
    cells.push(cell);
    records.push(cells);
  }
  return records;
}

function checkRow(r: OpenAIFeedRow, seen: Set<string>, problems: string[]) {
  const id = r.item_id || '(no item_id)';
  for (const key of REQUIRED) if (!r[key]) problems.push(`${id}: ${key} is empty`);
  for (const key of ALWAYS_SENT) if (!r[key]) problems.push(`${id}: ${key} is empty`);
  if (!AVAILABILITY.has(r.availability)) problems.push(`${id}: availability "${r.availability}" not in spec`);
  if (!MONEY_INR.test(r.price)) problems.push(`${id}: price "${r.price}" is not "amount INR"`);
  if (!MONEY_INR.test(r.shipping_price)) problems.push(`${id}: shipping_price "${r.shipping_price}" is not "amount INR"`);
  if (r.title.length > TITLE_MAX) problems.push(`${id}: title is ${r.title.length} chars`);
  if (r.description.length > DESCRIPTION_MAX) problems.push(`${id}: description is ${r.description.length} chars`);
  if (!HTTPS.test(r.url)) problems.push(`${id}: url "${r.url}" is not https`);
  if (!HTTPS.test(r.image_url)) problems.push(`${id}: image_url "${r.image_url}" is not https`);
  for (const u of r.additional_image_urls ?? []) if (!HTTPS.test(u)) problems.push(`${id}: additional image "${u}" is not https`);
  if (seen.has(r.item_id)) problems.push(`${id}: duplicate item_id`);
  seen.add(r.item_id);
  if (r.group_id !== undefined) {
    if (r.group_id === r.item_id) problems.push(`${id}: group_id equals item_id`);
    if (r.listing_has_variations !== true) problems.push(`${id}: variant row without listing_has_variations=true`);
    const values = Object.values(r.variant_dict ?? {});
    if (!values.length || values.some((v) => typeof v !== 'string' || !v)) problems.push(`${id}: variant_dict needs non-empty string values`);
  }
  for (const [key, value] of Object.entries(r)) {
    if (key === 'availability') continue;
    if (typeof value === 'string' && PLACEHOLDER.test(value.trim())) problems.push(`${id}: ${key} holds placeholder "${value}"`);
  }
  if (r.is_eligible_checkout) problems.push(`${id}: is_eligible_checkout is true but no checkout integration exists`);
}

function checkCsv(rows: OpenAIFeedRow[], problems: string[]) {
  const records = parseCsv(toCsv(rows));
  if (records.length !== rows.length + 1) {
    problems.push(`CSV has ${records.length} records for ${rows.length} rows plus a header`);
    return;
  }
  if (records[0].join(',') !== OPENAI_FEED_COLUMNS.join(',')) problems.push('CSV header does not match OPENAI_FEED_COLUMNS');
  const col = (name: (typeof OPENAI_FEED_COLUMNS)[number]) => OPENAI_FEED_COLUMNS.indexOf(name);
  rows.forEach((r, i) => {
    const cells = records[i + 1];
    const id = r.item_id;
    if (cells.length !== OPENAI_FEED_COLUMNS.length) {
      problems.push(`${id}: CSV row has ${cells.length} cells, expected ${OPENAI_FEED_COLUMNS.length}`);
      return;
    }
    if (cells[col('item_id')] !== r.item_id) problems.push(`${id}: CSV item_id cell differs`);
    if (cells[col('price')] !== r.price) problems.push(`${id}: CSV price cell differs`);
    if (cells[col('title')] !== r.title) problems.push(`${id}: CSV title cell differs`);
    const images = (r.additional_image_urls ?? []).map((u) => u.replace(/,/g, '%2C')).join(',');
    if (cells[col('additional_image_urls')] !== images) problems.push(`${id}: CSV additional_image_urls cell differs`);
    for (const key of ['is_eligible_search', 'is_eligible_checkout'] as const) {
      if (cells[col(key)] !== String(r[key])) problems.push(`${id}: CSV ${key} cell is "${cells[col(key)]}", expected ${String(r[key])}`);
    }
    const variantCell = cells[col('variant_dict')];
    if (variantCell !== JSON.stringify(r.variant_dict ?? '').replace(/^""$/, '')) problems.push(`${id}: CSV variant_dict cell differs`);
  });
}

function summarise(problems: string[]): string[] {
  const kinds = new Map<string, number>();
  for (const p of problems) {
    const kind = p.replace(/^[^:]+: /, '').replace(/"[^"]*"/g, '"..."').replace(/\d+/g, 'N');
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
  }
  return [...kinds.entries()].sort((a, b) => b[1] - a[1]).map(([kind, n]) => `${n} x ${kind}`);
}

async function main() {
  console.log(`catalogue: ${process.env.NEXT_PUBLIC_API_URL ?? '(NEXT_PUBLIC_API_URL unset, localhost default)'}`);
  const products = await fetchAllProducts({ strict: true, noStore: true, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  const rows = openaiFeedRows(products);
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) checkRow(r, seen, problems);

  const expectedRows = products.reduce((n, p) => n + expectedRowCount(p), 0);
  if (rows.length !== expectedRows) problems.push(`row count ${rows.length} differs from expected ${expectedRows} (one per size, one per un-sized product)`);
  if (!products.some((p) => p.sku) || !products.some((p) => p.description)) problems.push('catalogue carries no sku or description: not the feed endpoint');

  const jsonlLines = toJsonl(rows).trimEnd().split('\n');
  if (jsonlLines.length !== rows.length) problems.push(`JSONL has ${jsonlLines.length} lines for ${rows.length} rows`);
  jsonlLines.forEach((line, i) => {
    try {
      JSON.parse(line);
    } catch (err) {
      problems.push(`JSONL line ${i + 1} is not valid JSON: ${(err as Error).message}`);
    }
  });
  checkCsv(rows, problems);

  const byAvailability: Record<string, number> = {};
  for (const r of rows) byAvailability[r.availability] = (byAvailability[r.availability] ?? 0) + 1;
  console.log(`products ${products.length}, rows ${rows.length}, ${JSON.stringify(byAvailability)}`);

  if (problems.length) {
    const kinds = summarise(problems);
    console.error(`${problems.length} problem(s) in ${kinds.length} kind(s):`);
    for (const line of kinds) console.error(`   ${line}`);
    for (const p of problems.slice(0, DETAIL_LINES)) console.error(` - ${p}`);
    if (problems.length > DETAIL_LINES) console.error(` ... and ${problems.length - DETAIL_LINES} more`);
    process.exit(1);
  }
  console.log('OK: every row passes the OpenAI feed checks');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
