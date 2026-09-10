import { Newsletter } from '../models/Newsletter';

const BREVO_CONTACTS = 'https://api.brevo.com/v3/contacts';
const BREVO_BLOCKED = 'https://api.brevo.com/v3/smtp/blockedContacts';

interface BrevoBlockedContact {
  email?: string;
  reason?: { code?: string; message?: string };
  blockedAt?: string;
}

type BlockKind = 'unsubscribed' | 'bounced';
interface BlockedEntry {
  email: string;
  kind: BlockKind;
}

// Transactional sends (the /smtp/email API we use) do NOT create Brevo
// contacts, so unsubscribes land in the transactional block list, not on a
// contact's emailBlacklisted flag. This pulls that block list, which also
// carries hard bounces — both should stop future marketing sends. The reason
// code separates the two: unsubscribedViaEmail vs hardBounce.
async function fetchBlockedEmails(): Promise<BlockedEntry[]> {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.warn('[unsub-sync] BREVO_API_KEY not set — skipped');
    return [];
  }

  const limit = 100;
  let offset = 0;
  const blocked: BlockedEntry[] = [];

  while (true) {
    const url = new URL(BREVO_BLOCKED);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));

    const res = await fetch(url.toString(), {
      headers: { 'api-key': key, accept: 'application/json' },
    });
    if (!res.ok) {
      console.error('[unsub-sync] Brevo blockedContacts error:', res.status, await res.text());
      break;
    }

    const data = (await res.json()) as { contacts?: BrevoBlockedContact[]; count?: number };
    const contacts = data.contacts || [];
    for (const ct of contacts) {
      if (!ct.email) continue;
      const kind: BlockKind = ct.reason?.code === 'hardBounce' ? 'bounced' : 'unsubscribed';
      blocked.push({ email: ct.email.toLowerCase().trim(), kind });
    }

    if (contacts.length < limit) break;
    offset += limit;
  }

  return blocked;
}

/**
 * Pulls Brevo's transactional block list (unsubscribes + hard bounces) and
 * flags matching Newsletter rows as unsubscribed. Creates a suppression-only
 * Newsletter row when the address is not already stored, so it stays suppressed
 * even if it only ever came from Orders / Users / Reviews / Chat.
 */
export async function syncBrevoUnsubscribes(): Promise<{ found: number; unsubscribed: number; bounced: number; flagged: number; created: number }> {
  const entries = await fetchBlockedEmails();
  if (entries.length === 0) return { found: 0, unsubscribed: 0, bounced: 0, flagged: 0, created: 0 };

  const now = new Date();
  let flagged = 0;
  let created = 0;
  let unsubscribed = 0;
  let bounced = 0;

  for (const { email, kind } of entries) {
    if (kind === 'unsubscribed') unsubscribed++;
    else bounced++;

    const flag =
      kind === 'bounced'
        ? { bounced: true, bouncedAt: now }
        : { unsubscribed: true, unsubscribedAt: now };

    const existing = await Newsletter.findOne({ email }).lean();
    if (existing) {
      const already = kind === 'bounced' ? existing.bounced : existing.unsubscribed;
      if (!already) {
        await Newsletter.updateOne({ email }, flag);
        flagged++;
      }
    } else {
      try {
        await Newsletter.create({ email, source: 'uploaded', ...flag });
        created++;
      } catch {
        /* unique race — ignore */
      }
    }
  }

  console.log(`[unsub-sync] found=${entries.length} unsub=${unsubscribed} bounced=${bounced} flagged=${flagged} created=${created}`);
  return { found: entries.length, unsubscribed, bounced, flagged, created };
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
