import cron from 'node-cron';
import { syncBrevoUnsubscribes } from '../lib/syncUnsubscribes';

export function startUnsubscribeSyncJob(): void {
  // Daily 03:30 IST = 22:00 UTC. Pulls the last 2 days of Brevo changes so a
  // missed run still catches up, and flags unsubscribed contacts in the DB.
  cron.schedule('0 22 * * *', () => {
    const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    console.log('[cron] unsubscribe sync triggered');
    syncBrevoUnsubscribes(since).catch((err: Error) =>
      console.error('[cron] unsubscribe sync error:', err.message),
    );
  });

  console.log('[cron] Unsubscribe sync scheduled: 22:00 UTC (03:30 IST)');
}
