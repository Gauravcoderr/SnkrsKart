import cron from 'node-cron';
import { isAfterShipEnabled, syncOpenShipments } from '../services/aftership';

export function startAfterShipSyncJob(): void {
  if (!isAfterShipEnabled()) {
    console.log('[aftership] AFTERSHIP_API_KEY not set, tracking sync disabled');
    return;
  }
  cron.schedule('7 * * * *', async () => {
    try {
      const result = await syncOpenShipments();
      console.log(`[aftership] sync checked=${result.checked} registered=${result.registered}`);
    } catch (e) {
      console.error('[aftership] sync failed', e);
    }
  });
  console.log('[aftership] tracking sync scheduled hourly');
}
