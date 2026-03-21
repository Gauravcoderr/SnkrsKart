const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

export async function sendMail(options: { to: string; subject: string; html: string }) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[mailer] BREVO_API_KEY not set — email skipped');
    return;
  }

  const senderName = (process.env.EMAIL_FROM || 'SNKRS CART <infosnkrscart@gmail.com>')
    .match(/^(.*?)\s*</) ?.[1]?.trim() || 'SNKRS CART';
  const senderEmail = (process.env.EMAIL_FROM || 'SNKRS CART <infosnkrscart@gmail.com>')
    .match(/<(.+?)>/) ?.[1] || 'infosnkrscart@gmail.com';

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
