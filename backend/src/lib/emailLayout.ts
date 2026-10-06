// Bare domain 308-redirects to www, which breaks ESP image mirroring — force www.
// Vercel's *.vercel.app cert only covers one subdomain label, so www.snkrs-kart.vercel.app
// fails TLS entirely — never prepend www onto a vercel.app preview host.
function withWww(url: string): string {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('.vercel.app') && !u.hostname.startsWith('www.')) {
      u.hostname = `www.${u.hostname}`;
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

export const SITE = withWww(process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com');
export const LOGO_URL = `${SITE}/logo.jpg`;

export const EMAIL_REASON = {
  marketing: 'You received this because you shopped, reviewed, or subscribed.<br>Use the unsubscribe link below to stop receiving these emails.',
  order: 'You received this because you placed an order on SNKRS CART.',
  otp: 'You received this because this email was used to sign in to SNKRS CART.<br>If that was not you, you can safely ignore this email.',
  inquiry: 'You received this because you sent a purchase inquiry on SNKRS CART.',
  deal: 'You received this because you submitted a deal check on SNKRS CART.',
  newsletter: 'You received this because you subscribed to SNKRS CART drop alerts.<br>To unsubscribe, reply to this email.',
  seller: 'You received this because you have a seller account on SNKRS CART.',
  sellerApplication: 'You received this because you applied to sell on SNKRS CART.',
  admin: 'Internal notification for the SNKRS CART team.',
} as const;

export function emailFooterRows(reason: string): string {
  return `
          <!-- FOOTER RULE -->
          <tr><td style="background:#F4F4F5;padding:0 32px;"><div style="height:1px;background:#E4E4E7;"></div></td></tr>

          <!-- SOCIAL ICONS -->
          <tr>
            <td style="padding:28px 32px 16px;text-align:center;background:#F4F4F5;">
              <a href="https://www.instagram.com/snkrs_cart/" style="display:inline-block;margin:0 5px;text-decoration:none;vertical-align:top;width:34px;height:34px;background:#000000;border-radius:50%;text-align:center;line-height:34px;">
                <img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1786543961/email-icons/instagram-white-40.png" width="20" height="20" alt="Instagram" style="display:inline-block;vertical-align:middle;border:none;" />
              </a>
              <a href="https://wa.me/919410903791" style="display:inline-block;margin:0 5px;text-decoration:none;vertical-align:top;width:34px;height:34px;background:#000000;border-radius:50%;text-align:center;line-height:34px;">
                <img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1786543962/email-icons/whatsapp-white-40.png" width="20" height="20" alt="WhatsApp" style="display:inline-block;vertical-align:middle;border:none;" />
              </a>
            </td>
          </tr>

          <!-- CONNECT WITH US -->
          <tr>
            <td style="padding:0 32px 20px;text-align:center;background:#F4F4F5;">
              <p style="margin:0 0 10px;font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:700;color:#71717A;letter-spacing:2.5px;text-transform:uppercase;">Connect With Us</p>
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#52525B;line-height:2.2;">
                <a href="https://wa.me/919410903791" style="color:#52525B;text-decoration:none;">WhatsApp +91&nbsp;94109&nbsp;03791</a>
                &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                <a href="mailto:info@snkrscart.com" style="color:#52525B;text-decoration:none;">info@snkrscart.com</a>
                &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                <a href="${SITE}" style="color:#52525B;text-decoration:none;">snkrscart.com</a>
              </p>
            </td>
          </tr>

          <!-- BRAND + LEGAL -->
          <tr>
            <td style="background:#F4F4F5;padding:0 32px 28px;text-align:center;">
              <p style="margin:0 0 6px;font-family:Inter,Arial,sans-serif;font-size:11px;color:#A1A1AA;letter-spacing:0.5px;"><a href="${SITE}" style="color:#71717A;text-decoration:underline;font-weight:700;">SNKRS CART</a> &mdash; Sneakers. Culture. Community.</p>
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;line-height:1.6;color:#A1A1AA;">${reason}</p>
            </td>
          </tr>`;
}

export function emailDocument(opts: { rows: string; preheader?: string; css?: string }): string {
  const preheader = opts.preheader
    ? `<div style="display:none;font-size:1px;color:#F4F4F5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>SNKRS CART</title>
  <!--[if !mso]><!-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { margin: 0; padding: 0; background: #F4F4F5; -webkit-font-smoothing: antialiased; }
    @media only screen and (max-width: 620px) {
      .outer { width: 100% !important; }
      .pad { padding-left: 20px !important; padding-right: 20px !important; }
      ${opts.css ?? ''}
    }
  </style>
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:Inter,Arial,sans-serif;">
  ${preheader}

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F4F5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table class="outer" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
${opts.rows}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function transactionalShell(body: string, reason: string, preheader?: string): string {
  const rows = `
          <!-- HEADER -->
          <tr>
            <td style="background:#111111;padding:20px 32px;text-align:center;">
              <a href="${SITE}" style="text-decoration:none;display:inline-block;">
                <img src="${LOGO_URL}" alt="SNKRS CART" height="56" style="height:56px;width:auto;display:inline-block;border:none;" />
              </a>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td class="pad" style="background:#FFFFFF;padding:32px;color:#111111;font-family:Arial,sans-serif;font-size:14px;line-height:1.55;">
              ${body}
            </td>
          </tr>
${emailFooterRows(reason)}`;
  return emailDocument({ rows, preheader });
}
