import 'dotenv/config';
import axios from 'axios';
import { pingIndexNow } from '../lib/indexNow';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com').replace(/\/$/, '');

// Sends every live sitemap URL except thin blog tag pages to IndexNow (Bing, Yandex and others).
// Usage: npx ts-node --transpile-only src/scripts/indexNowSitemap.ts [--dry]
async function main() {
  const dry = process.argv.includes('--dry');
  const { data: xml } = await axios.get<string>(`${SITE_URL}/sitemap.xml`, { timeout: 90_000, responseType: 'text' });
  const host = new URL(SITE_URL).host;
  const paths = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => new URL(m[1]))
    .filter((u) => u.host === host && !u.pathname.startsWith('/blogs/tag/'))
    .map((u) => u.pathname);
  console.log(`${paths.length} URLs from ${SITE_URL}/sitemap.xml (tag pages left out)`);
  if (paths.length === 0) throw new Error('sitemap had no URLs on this host; nothing sent');
  if (dry) {
    console.log(paths.slice(0, 10).join('\n'));
    return;
  }
  const ok = await pingIndexNow(paths);
  console.log(ok ? `IndexNow accepted ${paths.length} URLs` : 'IndexNow refused the batch');
  if (!ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
