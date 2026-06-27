import cron from 'node-cron';
import { runRenderScraper } from '../services/scraper/index';

export function startScraperJob(): void {
  // Run 1: 01:17 AM IST = 19:47 UTC
  cron.schedule('47 19 * * *', () => {
    console.log('[cron] Scraper triggered — window 1 (01:17 IST)');
    runRenderScraper().catch((err: Error) => console.error('[cron] window-1 error:', err.message));
  });

  // Run 2: 04:43 AM IST = 23:13 UTC
  cron.schedule('13 23 * * *', () => {
    console.log('[cron] Scraper triggered — window 2 (04:43 IST)');
    runRenderScraper().catch((err: Error) => console.error('[cron] window-2 error:', err.message));
  });

  console.log('[cron] Scraper jobs scheduled: 19:47 UTC (01:17 IST) + 23:13 UTC (04:43 IST)');
}
