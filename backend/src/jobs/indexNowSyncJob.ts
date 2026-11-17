import cron from 'node-cron';
import { syncIndexNow } from '../lib/indexNowSync';

export function startIndexNowSyncJob(): void {
  cron.schedule('*/30 * * * *', () => {
    syncIndexNow()
      .then((n) => { if (n > 0) console.log(`[cron] IndexNow sync sent ${n} new URLs`); })
      .catch((err: Error) => console.error('[cron] IndexNow sync error:', err.message));
  });

  console.log('[cron] IndexNow sync scheduled: every 30 min');
}
