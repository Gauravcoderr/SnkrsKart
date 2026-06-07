import { sendMail } from './mailer';
import { Newsletter } from '../models/Newsletter';
import { Review } from '../models/Review';
import { Order } from '../models/Order';

const SITE = 'https://snkrscart.com';

async function getMarketingEmails(): Promise<string[]> {
  const [n, r, o] = await Promise.all([
    Newsletter.distinct('email') as Promise<string[]>,
    Review.distinct('email') as Promise<string[]>,
    Order.distinct('email') as Promise<string[]>,
  ]);
  // Set collapses duplicates: same email across all 3 sources → 1 entry
  return Array.from(new Set<string>([...n, ...r, ...o]));
}

async function getRecipients(): Promise<string[]> {
  if (process.env.TEST_EMAIL) return [process.env.TEST_EMAIL];
  return getMarketingEmails();
}

const LOGO_URL = `${SITE}/logo.jpg`;

// Force JPEG for email — f_auto can serve WebP which many email clients don't render
function emailImg(url: string): string {
  return url.replace(/\/f_auto/g, '/f_jpg').replace(/\/f_webp/g, '/f_jpg');
}

function emailShell(preheader: string, bodyRows: string): string {
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
      .headline { font-size: 26px !important; }
      .btn-cta { width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:Inter,Arial,sans-serif;">
  <div style="display:none;font-size:1px;color:#F4F4F5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F4F5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table class="outer" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          ${bodyRows}

          <!-- FOOTER RULE -->
          <tr><td style="background:#F4F4F5;padding:0 32px;"><div style="height:1px;background:#E4E4E7;"></div></td></tr>

          <!-- SOCIAL ICONS -->
          <tr>
            <td style="padding:28px 32px 16px;text-align:center;background:#F4F4F5;">
              <a href="https://www.instagram.com/snkrs_cart/" style="display:inline-block;margin:0 5px;text-decoration:none;vertical-align:top;width:34px;height:34px;background:#000000;border-radius:50%;text-align:center;line-height:34px;">
                <img src="https://res.cloudinary.com/dadulg5bs/image/upload/w_20,h_20,c_fit,f_png/email-icons/instagram-white.png" width="20" height="20" alt="Instagram" style="display:inline-block;vertical-align:middle;border:none;" />
              </a>
              <a href="https://wa.me/919410903791" style="display:inline-block;margin:0 5px;text-decoration:none;vertical-align:top;width:34px;height:34px;background:#000000;border-radius:50%;text-align:center;line-height:34px;">
                <img src="https://res.cloudinary.com/dadulg5bs/image/upload/w_20,h_20,c_fit,f_png/email-icons/whatsapp-white.png" width="20" height="20" alt="WhatsApp" style="display:inline-block;vertical-align:middle;border:none;" />
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
                <a href="mailto:infosnkrscart@gmail.com" style="color:#52525B;text-decoration:none;">infosnkrscart@gmail.com</a>
                &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                <a href="${SITE}" style="color:#52525B;text-decoration:none;">snkrscart.com</a>
              </p>
            </td>
          </tr>

          <!-- BRAND + LEGAL -->
          <tr>
            <td style="background:#F4F4F5;padding:0 32px 28px;text-align:center;">
              <p style="margin:0 0 6px;font-family:Inter,Arial,sans-serif;font-size:11px;color:#A1A1AA;letter-spacing:0.5px;"><a href="${SITE}" style="color:#71717A;text-decoration:underline;font-weight:700;">SNKRS CART</a> &mdash; Sneakers. Culture. Community.</p>
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;line-height:1.6;color:#A1A1AA;">You received this because you shopped, reviewed, or subscribed.<br>To stop receiving, reply STOP.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function productEmailHtml(p: {
  name: string;
  slug: string;
  brand?: string;
  colorway?: string;
  images?: string[];
  price?: number;
}): string {
  const url = `${SITE}/products/${p.slug}`;
  const img = p.images?.[0] ? emailImg(p.images[0]) : undefined;

  const heroRow = img
    ? `<tr><td style="background:#E4E4E7;line-height:0;font-size:0;">
        <a href="${url}" style="display:block;text-decoration:none;">
          <img src="${img}" alt="${p.name}" width="600" style="width:100%;max-height:380px;object-fit:cover;display:block;border:none;" />
        </a>
       </td></tr>`
    : `<tr><td height="200" style="background:#E4E4E7;text-align:center;vertical-align:middle;">
        <span style="font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:700;color:#A1A1AA;letter-spacing:4px;text-transform:uppercase;">NEW DROP</span>
       </td></tr>`;

  const priceRow = p.price
    ? `<tr><td class="pad" style="padding:0 32px 24px;background:#FFFFFF;">
        <span style="font-family:Inter,Arial,sans-serif;font-size:28px;font-weight:700;color:#18181B;">&#8377;${p.price.toLocaleString('en-IN')}</span>
       </td></tr>`
    : '';

  const meta = [p.brand, p.colorway].filter(Boolean).join(' &middot; ');

  const bodyRows = `
          <!-- HEADER -->
          <tr>
            <td style="background:#FFFFFF;padding:18px 32px;text-align:left;border-bottom:1px solid #E4E4E7;">
              <a href="${SITE}" style="text-decoration:none;display:inline-block;vertical-align:middle;">
                <img src="${LOGO_URL}" alt="SNKRS CART" height="52" style="height:52px;display:inline-block;vertical-align:middle;" />
              </a>
              <a href="${SITE}" style="text-decoration:none;display:inline-block;vertical-align:middle;margin-left:10px;">
                <span style="font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:800;color:#18181B;letter-spacing:-0.4px;vertical-align:middle;">SNKRS CART</span>
              </a>
            </td>
          </tr>

          <!-- HERO -->
          ${heroRow}

          <!-- LABEL + NAME -->
          <tr>
            <td class="pad" style="padding:28px 32px 8px;background:#FFFFFF;">
              <p style="margin:0 0 10px;font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:700;color:#A1A1AA;letter-spacing:2.5px;text-transform:uppercase;">Just Dropped</p>
              <h1 class="headline" style="margin:0 0 6px;font-family:Inter,Arial,sans-serif;font-size:30px;font-weight:700;color:#18181B;line-height:1.15;letter-spacing:-0.5px;">${p.name}</h1>
              ${meta ? `<p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#71717A;">${meta}</p>` : ''}
            </td>
          </tr>

          <!-- RULE -->
          <tr><td style="background:#FFFFFF;padding:20px 32px 0;"><div style="height:1px;background:#E4E4E7;"></div></td></tr>

          <!-- PRICE -->
          ${priceRow}

          <!-- CTA -->
          <tr>
            <td class="pad" style="padding:${p.price ? '0' : '24px'} 32px 36px;background:#FFFFFF;">
              <a class="btn-cta" href="${url}" style="display:block;text-align:center;padding:15px 32px;background:#18181B;color:#FFFFFF;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Shop Now &rarr;</a>
            </td>
          </tr>`;

  return emailShell(`${p.name} just landed. Shop before sizes run out.`, bodyRows);
}

function blogEmailHtml(b: {
  title: string;
  slug: string;
  coverImage?: string;
  excerpt?: string;
}): string {
  const url = `${SITE}/blogs/${b.slug}`;
  const img = b.coverImage ? emailImg(b.coverImage) : undefined;
  const excerpt = b.excerpt ? b.excerpt.slice(0, 180) + (b.excerpt.length > 180 ? '&hellip;' : '') : '';

  const heroRow = img
    ? `<tr><td style="background:#E4E4E7;line-height:0;font-size:0;">
        <a href="${url}" style="display:block;text-decoration:none;">
          <img src="${img}" alt="${b.title}" width="600" style="width:100%;max-height:320px;object-fit:cover;display:block;border:none;" />
        </a>
       </td></tr>`
    : `<tr><td height="140" style="background:#F4F4F5;border-bottom:1px solid #E4E4E7;"></td></tr>`;

  const excerptRow = excerpt
    ? `<tr><td class="pad" style="padding:0 32px 24px;background:#FFFFFF;">
        <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.7;color:#52525B;">${excerpt}</p>
       </td></tr>`
    : '';

  const bodyRows = `
          <!-- HEADER -->
          <tr>
            <td style="background:#FFFFFF;padding:18px 32px;text-align:left;border-bottom:1px solid #E4E4E7;">
              <a href="${SITE}" style="text-decoration:none;display:inline-block;vertical-align:middle;">
                <img src="${LOGO_URL}" alt="SNKRS CART" height="52" style="height:52px;display:inline-block;vertical-align:middle;" />
              </a>
              <a href="${SITE}" style="text-decoration:none;display:inline-block;vertical-align:middle;margin-left:10px;">
                <span style="font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:800;color:#18181B;letter-spacing:-0.4px;vertical-align:middle;">SNKRS CART</span>
              </a>
            </td>
          </tr>

          <!-- HERO -->
          ${heroRow}

          <!-- LABEL + TITLE -->
          <tr>
            <td class="pad" style="padding:28px 32px 12px;background:#FFFFFF;">
              <p style="margin:0 0 10px;font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:700;color:#A1A1AA;letter-spacing:2.5px;text-transform:uppercase;">New on the Blog</p>
              <h1 class="headline" style="margin:0;font-family:Inter,Arial,sans-serif;font-size:28px;font-weight:700;color:#18181B;line-height:1.2;letter-spacing:-0.3px;">${b.title}</h1>
            </td>
          </tr>

          <!-- EXCERPT -->
          ${excerptRow}

          <!-- RULE -->
          <tr><td style="background:#FFFFFF;padding:0 32px 24px;"><div style="height:1px;background:#E4E4E7;"></div></td></tr>

          <!-- CTA -->
          <tr>
            <td class="pad" style="padding:0 32px 36px;background:#FFFFFF;">
              <a class="btn-cta" href="${url}" style="display:block;text-align:center;padding:15px 32px;background:#18181B;color:#FFFFFF;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Read the Story &rarr;</a>
            </td>
          </tr>`;

  return emailShell(`New read: ${b.title}`, bodyRows);
}

export async function sendProductLaunchBlast(
  product: { name: string; slug: string; brand?: string; colorway?: string; images?: string[]; price?: number },
  customSubject?: string,
  customHtml?: string,
): Promise<void> {
  const recipients = await getRecipients();
  if (!recipients.length) return;
  const subject = customSubject || `Just Dropped: ${product.name}`;
  const html = customHtml || productEmailHtml(product);
  console.log(`[email] product blast → ${recipients.length} recipients`);
  await Promise.allSettled(recipients.map(email => sendMail({ to: email, subject, html })));
}

export async function sendBlogPublishBlast(
  blog: { title: string; slug: string; coverImage?: string; excerpt?: string },
  customSubject?: string,
  customHtml?: string,
): Promise<void> {
  const recipients = await getRecipients();
  if (!recipients.length) return;
  const subject = customSubject || `New on the Blog: ${blog.title}`;
  const html = customHtml || blogEmailHtml(blog);
  console.log(`[email] blog blast → ${recipients.length} recipients`);
  await Promise.allSettled(recipients.map(email => sendMail({ to: email, subject, html })));
}

export async function sendMultipleBlogBlast(
  blogs: { title: string; slug: string; coverImage?: string; excerpt?: string }[],
  customSubject?: string,
): Promise<void> {
  if (!blogs.length) return;
  const recipients = await getRecipients();
  if (!recipients.length) return;

  const subject = customSubject || `${blogs.length} New Reads on SNKRS CART`;

  const blogCards = blogs.map((b) => {
    const url = `${SITE}/blogs/${b.slug}`;
    const img = b.coverImage ? emailImg(b.coverImage) : undefined;
    const excerpt = b.excerpt ? b.excerpt.slice(0, 120) + (b.excerpt.length > 120 ? '&hellip;' : '') : '';

    const imgRow = img
      ? `<tr><td style="line-height:0;font-size:0;"><a href="${url}" style="display:block;text-decoration:none;"><img src="${img}" alt="${b.title}" width="536" style="width:100%;max-height:220px;object-fit:cover;display:block;border:none;border-radius:6px 6px 0 0;" /></a></td></tr>`
      : '';

    return `
          <!-- BLOG CARD -->
          <tr>
            <td style="background:#FFFFFF;border-radius:8px;overflow:hidden;margin-bottom:16px;border:1px solid #E4E4E7;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${imgRow}
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <p style="margin:0 0 6px;font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:700;color:#A1A1AA;letter-spacing:2px;text-transform:uppercase;">New on the Blog</p>
                    <h2 style="margin:0 0 8px;font-family:Inter,Arial,sans-serif;font-size:18px;font-weight:700;color:#18181B;line-height:1.3;">${b.title}</h2>
                    ${excerpt ? `<p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.6;color:#52525B;">${excerpt}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px 20px;">
                    <a href="${url}" style="display:inline-block;padding:10px 24px;background:#18181B;color:#FFFFFF;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Read the Story &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td height="12" style="font-size:0;line-height:0;">&nbsp;</td></tr>`;
  }).join('');

  const bodyRows = `
          <!-- HEADER -->
          <tr>
            <td style="background:#FFFFFF;padding:18px 32px;text-align:left;border-bottom:1px solid #E4E4E7;">
              <a href="${SITE}" style="text-decoration:none;display:inline-block;vertical-align:middle;">
                <img src="${LOGO_URL}" alt="SNKRS CART" height="52" style="height:52px;display:inline-block;vertical-align:middle;" />
              </a>
              <a href="${SITE}" style="text-decoration:none;display:inline-block;vertical-align:middle;margin-left:10px;">
                <span style="font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:800;color:#18181B;letter-spacing:-0.4px;vertical-align:middle;">SNKRS CART</span>
              </a>
            </td>
          </tr>

          <!-- INTRO -->
          <tr>
            <td style="background:#F4F4F5;padding:24px 32px 12px;">
              <p style="margin:0 0 4px;font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:700;color:#A1A1AA;letter-spacing:2.5px;text-transform:uppercase;">Fresh Reads</p>
              <h1 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:24px;font-weight:700;color:#18181B;line-height:1.2;">${blogs.length} New Stories Just Dropped</h1>
            </td>
          </tr>

          <!-- BLOG CARDS -->
          <tr>
            <td style="background:#F4F4F5;padding:12px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${blogCards}
              </table>
            </td>
          </tr>`;

  const html = emailShell(`${blogs.length} new stories just dropped on SNKRS CART`, bodyRows);
  console.log(`[email] multi-blog blast (${blogs.length} blogs) → ${recipients.length} recipients`);
  await Promise.allSettled(recipients.map(email => sendMail({ to: email, subject, html })));
}

export async function sendCustomBlast(subject: string, html: string): Promise<void> {
  const recipients = await getRecipients();
  if (!recipients.length) return;
  console.log(`[email] custom blast → ${recipients.length} recipients`);
  await Promise.allSettled(recipients.map(email => sendMail({ to: email, subject, html })));
}
