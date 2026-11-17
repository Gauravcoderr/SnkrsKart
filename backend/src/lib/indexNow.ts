import axios from 'axios';

const INDEXNOW_KEY = '35d21f896b75991d1d42f7b69226961d';
const INDEXNOW_MAX_URLS = 10_000;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com').replace(/\/$/, '');

// Pings IndexNow (Bing, Yandex, Seznam + others) so new/updated pages get crawled
// within minutes instead of waiting for the next scheduled crawl. Resolves false when IndexNow refused.
export async function pingIndexNow(paths: string[]): Promise<boolean> {
  if (paths.length === 0) return true;
  const host = new URL(SITE_URL).hostname;
  try {
    for (let i = 0; i < paths.length; i += INDEXNOW_MAX_URLS) {
      await axios.post('https://api.indexnow.org/indexnow', {
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: paths.slice(i, i + INDEXNOW_MAX_URLS).map((p) => `${SITE_URL}${p}`),
      }, { timeout: 8000 });
    }
    return true;
  } catch (err) {
    console.error('[indexnow] ping failed:', (err as Error).message);
    return false;
  }
}
