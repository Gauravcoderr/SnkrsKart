import cron from 'node-cron';
import { getInstagramConfig, isInstagramEnabled } from '../services/instagram';
import { runDueInstagramPosts } from '../services/instagramPublisher';
import { refreshTokenIfDue } from '../services/instagramToken';

export function startInstagramPublishJob(): void {
  const cfg = getInstagramConfig();
  if (!isInstagramEnabled(cfg)) {
    console.log('[instagram] IG_USER_ID / IG_ACCESS_TOKEN not set, publisher disabled');
    return;
  }

  // Every 5 minutes: publish approved posts whose time has come. Render stays
  // awake through the UptimeRobot /health ping, same as the other cron jobs.
  cron.schedule('*/5 * * * *', async () => {
    try {
      const r = await runDueInstagramPosts();
      if (r.published || r.notPublished) console.log(`[instagram] published=${r.published} notPublished=${r.notPublished}`);
    } catch (e) {
      console.error('[instagram] publish run failed', (e as Error).message);
    }
  });

  // Daily 09:20 IST = 03:50 UTC: keep the 60-day Instagram Login token alive.
  cron.schedule('50 3 * * *', async () => {
    try {
      const outcome = await refreshTokenIfDue(getInstagramConfig());
      if (outcome !== 'not-due') console.log(`[instagram] token refresh: ${outcome}`);
    } catch (e) {
      console.error('[instagram] token refresh failed', (e as Error).message);
    }
  });

  console.log(`[instagram] publisher scheduled every 5 min${cfg.dryRun ? ' (DRY RUN, nothing reaches Instagram)' : ''}`);
}
