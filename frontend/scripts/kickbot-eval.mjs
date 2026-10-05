const BASE = process.env.KICKBOT_URL || 'http://localhost:3131';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://snkrskart.onrender.com/api/v1';

const CASES = [
  { name: 'jordan 4 under budget', messages: ['which jordan 4 do you have under 20000?'], expectSlug: 'jordan-4-retro-cozy-girl-hemp-light-orewood-brown', forbid: ['canyon purple', 'seafoam', 'fire red'] },
  { name: 'gift for woman keeps entity', messages: ['any jordan 4 for gifting to a woman?'], forbid: ['canyon purple', 'seafoam'] },
  { name: 'size 9 nike', messages: ['nike size 9 under 12000'], expectCards: true },
  { name: 'narrow: cheaper', messages: ['show me adidas', 'cheaper ones'], expectCards: true },
  { name: 'narrow: show more', messages: ['new balance for running', 'show more'], expectCards: true },
  { name: 'exact model not stocked', messages: ['do you have the nike air max 97 silver bullet?'], forbid: ['₹'] , allowNoCards: true },
  { name: 'order lookup', messages: ['track order SC-TEST-123 for test@example.com'], allowNoCards: true },
  { name: 'abusive', messages: ['you are useless, f*** off'], expectText: /friendly/i, allowNoCards: true },
  { name: 'off topic', messages: ['write me a python script for fibonacci'], expectText: /sneaker/i, allowNoCards: true },
  { name: 'greeting', messages: ['hi'], allowNoCards: true },
];

async function loadCatalog() {
  const names = new Set();
  const slugs = new Set();
  for (let page = 1; page <= 6; page++) {
    const res = await fetch(`${API}/products?limit=48&page=${page}`);
    if (!res.ok) break;
    const data = await res.json();
    const products = data.products ?? [];
    for (const p of products) { names.add(norm(p.name)); slugs.add(p.slug); }
    if (products.length < 48) break;
  }
  return { names, slugs };
}

function norm(s) {
  return s.toLowerCase().replace(/[‘’'"`’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

async function ask(history) {
  const messages = [];
  let last = null;
  for (const text of history) {
    messages.push({ role: 'user', content: text });
    let res = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        res = await fetch(`${BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        });
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
    last = { status: res.status, ...(await res.json()) };
    messages.push({ role: 'assistant', content: last.text ?? '' });
  }
  return last;
}

const catalog = await loadCatalog();
console.log(`catalog loaded: ${catalog.slugs.size} products\n`);
let failures = 0;

for (const c of CASES) {
  const r = await ask(c.messages);
  const text = r.text ?? '';
  const cardSlugs = (r.products ?? []).map((p) => p.slug);
  const problems = [];

  for (const slug of cardSlugs) if (!catalog.slugs.has(slug)) problems.push(`card slug not in catalog: ${slug}`);
  for (const bold of text.matchAll(/\*\*([^*\n]{4,80})\*\*/g)) {
    const claim = norm(bold[1].replace(/\s[—–-]\s.*$/, ''));
    if (claim.length < 6 || !/\b(nike|jordan|adidas|new balance|crocs|air|dunk|retro|force|max)\b/i.test(bold[1])) continue;
    const ok = [...catalog.names].some((n) => n.includes(claim) || claim.includes(n));
    if (!ok) problems.push(`bold product not in catalog: "${bold[1]}"`);
  }
  for (const f of c.forbid ?? []) if (text.toLowerCase().includes(f)) problems.push(`forbidden phrase: ${f}`);
  if (c.expectSlug && !cardSlugs.includes(c.expectSlug)) problems.push(`expected card ${c.expectSlug}, got [${cardSlugs.join(', ')}]`);
  if (c.expectCards && cardSlugs.length === 0) problems.push('expected product cards, got none');
  if (c.expectText && !c.expectText.test(text)) problems.push(`expected text /${c.expectText.source}/`);
  if (!text.trim()) problems.push('empty reply');

  const status = problems.length ? 'FAIL' : 'ok  ';
  if (problems.length) failures++;
  console.log(`${status} ${c.name}  [${r.status}] cards=${cardSlugs.length}`);
  console.log(`     ${text.slice(0, 160).replace(/\n/g, ' ')}`);
  for (const p of problems) console.log(`     ✗ ${p}`);
  await new Promise((r) => setTimeout(r, 1500));
}

console.log(`\n${CASES.length - failures}/${CASES.length} passed`);
process.exit(failures ? 1 : 0);
