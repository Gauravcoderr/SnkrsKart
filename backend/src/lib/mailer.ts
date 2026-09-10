const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

export async function sendMail(options: { to: string; subject: string; html: string }) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[mailer] BREVO_API_KEY not set — email skipped');
    return;
  }

  const senderName = (process.env.EMAIL_FROM || 'SNKRS CART <info@snkrscart.com>')
    .match(/^(.*?)\s*</) ?.[1]?.trim() || 'SNKRS CART';
  const senderEmail = (process.env.EMAIL_FROM || 'SNKRS CART <info@snkrscart.com>')
    .match(/<(.+?)>/) ?.[1] || 'info@snkrscart.com';

  console.log(`[mailer] Sending to ${options.to} | ${options.subject}`);

  try {
    const res = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[mailer] Brevo API error:', res.status, body);
    } else {
      console.log('[mailer] Email sent OK');
    }
  } catch (err) {
    console.error('[mailer] Email send failed:', err);
  }
}

function resolveSender() {
  const from = process.env.EMAIL_FROM || 'SNKRS CART <info@snkrscart.com>';
  const name = from.match(/^(.*?)\s*</)?.[1]?.trim() || 'SNKRS CART';
  const email = from.match(/<(.+?)>/)?.[1] || 'info@snkrscart.com';
  return { name, email };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function sendBatchMail(
  recipients: string[],
  subject: string,
  html: string,
): Promise<{ sent: number; failed: number; batches: number }> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[mailer] BREVO_API_KEY not set — batch email skipped');
    return { sent: 0, failed: recipients.length, batches: 0 };
  }

  const clean = Array.from(
    new Set(recipients.map((e) => (e || '').trim().toLowerCase()).filter(Boolean)),
  );
  if (clean.length === 0) return { sent: 0, failed: 0, batches: 0 };

  const sender = resolveSender();
  const size = Math.min(Math.max(Number(process.env.EMAIL_BATCH_SIZE) || 100, 1), 1000);
  const delay = Math.max(Number(process.env.EMAIL_BATCH_DELAY) || 500, 0);
  const batches = chunk(clean, size);

  let sent = 0;
  let failed = 0;

  console.log(`[mailer] batch send → ${clean.length} recipients in ${batches.length} batch(es) of ${size}`);

  for (let i = 0; i < batches.length; i++) {
    const group = batches[i];
    const payload = {
      sender,
      subject,
      htmlContent: html,
      messageVersions: group.map((email) => ({ to: [{ email }] })),
    };

    let attempt = 0;
    while (attempt < 2) {
      try {
        const res = await fetch(BREVO_API, {
          method: 'POST',
          headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.status === 429 && attempt === 0) {
          const reset = Number(res.headers.get('x-sib-ratelimit-reset')) || 2;
          console.warn(`[mailer] 429 on batch ${i + 1} — waiting ${reset}s then retrying`);
          await sleep(reset * 1000);
          attempt++;
          continue;
        }

        if (!res.ok) {
          const body = await res.text();
          console.error(`[mailer] batch ${i + 1} error:`, res.status, body);
          failed += group.length;
        } else {
          sent += group.length;
          console.log(`[mailer] batch ${i + 1}/${batches.length} sent (${group.length})`);
        }
        break;
      } catch (err) {
        console.error(`[mailer] batch ${i + 1} send failed:`, err);
        failed += group.length;
        break;
      }
    }

    if (i < batches.length - 1 && delay > 0) await sleep(delay);
  }

  console.log(`[mailer] batch send done — sent=${sent} failed=${failed}`);
  return { sent, failed, batches: batches.length };
}
