import { Newsletter } from '../models/Newsletter';

const BREVO_CONTACTS = 'https://api.brevo.com/v3/contacts';

interface BrevoContact {
  email?: string;
  emailBlacklisted?: boolean;
  modifiedAt?: string;
}

async function fetchBlacklistedEmails(modifiedSince?: string): Promise<string[]> {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.warn('[unsub-sync] BREVO_API_KEY not set — skipped');
    return [];
  }

  const limit = 500;
  let offset = 0;
  const blacklisted: string[] = [];

  while (true) {
    const url = new URL(BREVO_CONTACTS);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('sort', 'desc');
    if (modifiedSince) url.searchParams.set('modifiedSince', modifiedSince);

    const res = await fetch(url.toString(), {
      headers: { 'api-key': key, accept: 'application/json' },
    });
    if (!res.ok) {
      console.error('[unsub-sync] Brevo contacts error:', res.status, await res.text());
      break;
    }

    const data = (await res.json()) as { contacts?: BrevoContact[]; count?: number };
    const contacts = data.contacts || [];
    for (const ct of contacts) {
      if (ct.emailBlacklisted && ct.email) blacklisted.push(ct.email.toLowerCase().trim());
    }

    if (contacts.length < limit) break;
    offset += limit;
  }

  return blacklisted;
}

/**
 * Pulls unsubscribed (emailBlacklisted) contacts from Brevo and flags matching
 * Newsletter rows as unsubscribed. Creates a suppression-only Newsletter row
 * when the address is not already stored, so the address stays suppressed even
 * if it only ever came from Orders / Users / Reviews.
 */
export async function syncBrevoUnsubscribes(modifiedSince?: string): Promise<{ found: number; flagged: number; created: number }> {
  const emails = await fetchBlacklistedEmails(modifiedSince);
  if (emails.length === 0) return { found: 0, flagged: 0, created: 0 };

  const now = new Date();
  let flagged = 0;
  let created = 0;

  for (const email of emails) {
    const existing = await Newsletter.findOne({ email }).lean();
    if (existing) {
      if (!existing.unsubscribed) {
        await Newsletter.updateOne({ email }, { unsubscribed: true, unsubscribedAt: now });
        flagged++;
      }
    } else {
      try {
        await Newsletter.create({ email, source: 'uploaded', unsubscribed: true, unsubscribedAt: now });
        created++;
      } catch {
        /* unique race — ignore */
      }
    }
  }

  console.log(`[unsub-sync] found=${emails.length} flagged=${flagged} created=${created}`);
  return { found: emails.length, flagged, created };
}

/**
 * Reactivates a contact who previously unsubscribed. Any explicit activity
 * (newsletter signup, order, review, login, chat) is treated as re-opting in:
 * clears the DB unsubscribed flag and un-blacklists them on Brevo.
 * No-op when the address was never unsubscribed, so it's cheap to call on
 * every such event. Never throws — failures are logged, not propagated.
 */
export async function reactivateContact(email?: string): Promise<void> {
  if (!email) return;
  const clean = email.trim().toLowerCase();
  if (!clean) return;
  try {
    const row = await Newsletter.findOne({ email: clean }).lean();
    if (row?.unsubscribed) {
      await Newsletter.updateOne(
        { email: clean },
        { unsubscribed: false, $unset: { unsubscribedAt: 1 } },
      );
      await resubscribeOnBrevo(clean);
    }
  } catch (err) {
    console.error('[reactivate] failed:', err);
  }
}

/**
 * Re-subscribes an email on Brevo by clearing its email blacklist flag. Called
 * when a previously-unsubscribed person opts back in through the signup form —
 * without this, Brevo keeps blocking them at send time.
 */
export async function resubscribeOnBrevo(email: string): Promise<boolean> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return false;
  const clean = email.trim().toLowerCase();
  try {
    const res = await fetch(`${BREVO_CONTACTS}/${encodeURIComponent(clean)}`, {
      method: 'PUT',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailBlacklisted: false }),
    });
    // 404 = contact never existed on Brevo, which is fine — nothing to unblock.
    if (res.ok || res.status === 404) return true;
    console.error('[resubscribe] Brevo error:', res.status, await res.text());
    return false;
  } catch (err) {
    console.error('[resubscribe] failed:', err);
    return false;
  }
}
