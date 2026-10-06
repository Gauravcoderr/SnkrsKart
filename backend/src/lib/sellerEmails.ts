import { sendMail } from './mailer';
import { EMAIL_REASON, transactionalShell } from './emailLayout';
import { ISellerOrder } from '../models/SellerOrder';
import { AVAILABILITY_LABEL, AVAILABILITY_SHIP_DAYS } from '../models/SellerListing';
import { LATE_PENALTY_TEXT } from '../models/SellerOrder';

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const adminEmail = () => process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER || 'info@snkrscart.com';

const shell = (body: string, reason: string = EMAIL_REASON.seller) => transactionalShell(body, reason);

function itemsTable(order: ISellerOrder): string {
  const rows = order.items.map((it) => `
    <tr>
      <td style="padding:8px 4px;border-bottom:1px solid #f0f0f0;">
        ${it.image ? `<img src="${it.image}" width="48" height="48" style="object-fit:contain;border-radius:6px;background:#f9f9f9;" />` : ''}
      </td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:13px;">
        <strong>${it.brand}</strong> ${it.name}<br/>
        <span style="color:#888;">Size UK ${it.size} · Qty ${it.qty} · ${AVAILABILITY_LABEL[it.availability]}</span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;font-weight:bold;">
        ₹${(it.sellerPrice * it.qty).toLocaleString('en-IN')}
      </td>
    </tr>`).join('');
  return `<table style="width:100%;border-collapse:collapse;">${rows}</table>`;
}

const fmtDate = (d: Date | null | undefined) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST' : '';

function timelineBlock(order: ISellerOrder): string {
  if (!order.shipBy) return '';
  const slowest = Math.max(...order.items.map((it) => AVAILABILITY_SHIP_DAYS[it.availability] ?? 3));
  return `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Fulfilment timeline</p>
      <p style="margin:0 0 4px;font-size:15px;color:#111;"><strong>Ship by ${fmtDate(order.shipBy)}</strong> <span style="color:#666;font-size:13px;">(${slowest} day${slowest === 1 ? '' : 's'} from payment, based on the availability you listed)</span></p>
      <p style="margin:0;font-size:13px;color:#444;">Upload verification photos first, then add the courier tracking once SNKRS CART approves them. Tracking added = shipped.</p>
      <p style="margin:10px 0 0;font-size:12px;color:#92400e;">${LATE_PENALTY_TEXT}</p>
    </div>`;
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:16px;background:#111;color:#fff;padding:12px 22px;text-decoration:none;font-size:13px;font-weight:bold;border-radius:6px;">${label}</a>`;

export function sendSellerCredentialsEmail(to: string, name: string, tempPassword: string, isReset: boolean) {
  sendMail({
    to,
    subject: isReset ? 'Your SNKRS CART seller password was reset' : 'Your SNKRS CART seller account is ready',
    html: shell(`
      <p style="font-size:16px;margin-top:0;">Hi <strong>${name}</strong>,</p>
      <p style="color:#444;">${isReset
        ? 'Your seller portal password has been reset. Use the temporary password below to sign in, then set a new one.'
        : 'Your seller account on SNKRS CART is live. Sign in to list your pairs, track orders and add shipping details.'}</p>
      <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Login email</p>
        <p style="margin:0 0 14px;font-size:15px;font-weight:bold;">${to}</p>
        <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Temporary password</p>
        <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:3px;font-family:monospace;">${tempPassword}</p>
      </div>
      <p style="color:#666;font-size:13px;">You will be asked to choose a new password on first login. Keep these details private.</p>
      ${btn(`${siteUrl()}/sellers/login`, 'Open Seller Portal')}
    `),
  });
}

export function sendSellerNewOrderEmail(to: string, name: string, order: ISellerOrder) {
  sendMail({
    to,
    subject: `New order ${order.orderNumber} — verify your pair | SNKRS CART`,
    html: shell(`
      <p style="font-size:16px;margin-top:0;">Hi <strong>${name}</strong>, you have a new order.</p>
      <p style="color:#444;">Order <strong>${order.orderNumber}</strong> is paid and confirmed. Upload live verification photos of the pair in the seller portal. Once SNKRS CART approves them you can add the courier tracking.</p>
      ${itemsTable(order)}
      ${timelineBlock(order)}
      <p style="margin-top:14px;font-size:14px;"><strong>Your payout for this order: ₹${order.sellerTotal.toLocaleString('en-IN')}</strong></p>
      ${order.deliveryCity ? `<p style="color:#666;font-size:13px;">Ships to ${order.deliveryCity}, ${order.deliveryState}. Full address is shared over WhatsApp after verification.</p>` : ''}
      ${btn(`${siteUrl()}/sellers/orders/${order._id}`, 'Upload Verification Photos')}
    `),
  });
}

export function sendAdminVerificationSubmittedEmail(order: ISellerOrder, sellerName: string) {
  const photos = order.verification.photos.map((p) => `<a href="${p.url}" style="display:inline-block;margin:4px;"><img src="${p.url}" width="110" height="110" style="object-fit:cover;border-radius:8px;border:1px solid #eee;" alt="${p.angle}" /></a>`).join('');
  sendMail({
    to: adminEmail(),
    subject: `Seller verification submitted — ${order.orderNumber} — ${sellerName}`,
    html: shell(`
      <p style="font-size:16px;font-weight:bold;margin-top:0;">${sellerName} uploaded verification photos for ${order.orderNumber}</p>
      ${itemsTable(order)}
      <div style="margin-top:16px;">${photos}</div>
      ${btn(`${siteUrl()}/admin/seller-orders`, 'Review in Admin →')}
    `, EMAIL_REASON.admin),
  });
}

export function sendSellerVerificationResultEmail(to: string, name: string, order: ISellerOrder) {
  const approved = order.verification.status === 'approved';
  sendMail({
    to,
    subject: approved
      ? `Verification approved — add tracking for ${order.orderNumber} | SNKRS CART`
      : `Verification needs another look — ${order.orderNumber} | SNKRS CART`,
    html: shell(`
      <p style="font-size:16px;margin-top:0;">Hi <strong>${name}</strong>,</p>
      ${approved
        ? `<p style="color:#444;">Your photos for order <strong>${order.orderNumber}</strong> were approved. Request the customer's shipping details on WhatsApp from the order page, ship the pair, then add the courier and tracking number. Tracking can be entered once, so double check it.</p>${order.shipBy ? `<p style="color:#92400e;font-size:13px;"><strong>Ship by ${fmtDate(order.shipBy)}.</strong> ${LATE_PENALTY_TEXT}</p>` : ''}`
        : `<p style="color:#444;">We could not approve the photos for order <strong>${order.orderNumber}</strong>. Please retake them and submit again.</p>`}
      ${order.verification.adminNote ? `<div style="background:#fafafa;border-left:3px solid #111;padding:12px 16px;margin:16px 0;font-size:14px;color:#333;"><strong>Note from SNKRS CART:</strong><br/>${order.verification.adminNote}</div>` : ''}
      ${btn(`${siteUrl()}/sellers/orders/${order._id}`, approved ? 'Add Tracking' : 'Retake Photos')}
    `),
  });
}

export function sendCustomerShippedEmail(opts: {
  to: string; name: string; orderNumber: string; orderId: string;
  deliveryService: string; trackingNumber: string;
  items: Array<{ name: string; brand: string; size: string; qty: number; image: string }>;
}) {
  const rows = opts.items.map((it) => `
    <tr>
      <td style="padding:8px 4px;border-bottom:1px solid #f0f0f0;">${it.image ? `<img src="${it.image}" width="48" height="48" style="object-fit:contain;border-radius:6px;background:#f9f9f9;" />` : ''}</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:13px;"><strong>${it.brand}</strong> ${it.name}<br/><span style="color:#888;">Size: ${it.size} · Qty: ${it.qty}</span></td>
    </tr>`).join('');
  sendMail({
    to: opts.to,
    subject: `Your order ${opts.orderNumber} has shipped | SNKRS CART`,
    html: shell(`
      <p style="font-size:16px;margin-top:0;">Good news, ${opts.name}!</p>
      <p style="color:#444;">Part or all of your order <strong>${opts.orderNumber}</strong> is on its way.</p>
      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#6d28d9;text-transform:uppercase;letter-spacing:1px;">${opts.deliveryService || 'Courier'}</p>
        <p style="margin:0;font-size:20px;font-weight:900;font-family:monospace;color:#111;">${opts.trackingNumber}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      ${btn(`${siteUrl()}/account/orders`, 'Track Your Order')}
    `, EMAIL_REASON.order),
  });
}

export function sendSellerPayoutEmail(to: string, name: string, order: ISellerOrder) {
  sendMail({
    to,
    subject: `Payout released — ₹${order.payout.amount.toLocaleString('en-IN')} for ${order.orderNumber} | SNKRS CART`,
    html: shell(`
      <p style="font-size:16px;margin-top:0;">Hi <strong>${name}</strong>,</p>
      <p style="color:#444;">Your payout for order <strong>${order.orderNumber}</strong> has been released.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#166534;text-transform:uppercase;letter-spacing:1px;">Amount paid</p>
        <p style="margin:0;font-size:26px;font-weight:900;color:#111;">₹${order.payout.amount.toLocaleString('en-IN')}</p>
        ${order.payout.reference ? `<p style="margin:10px 0 0;font-size:13px;color:#333;">Reference / UTR: <strong>${order.payout.reference}</strong></p>` : ''}
      </div>
      ${itemsTable(order)}
      ${order.payout.note ? `<div style="background:#fafafa;border-left:3px solid #111;padding:12px 16px;margin:16px 0;font-size:14px;color:#333;">${order.payout.note}</div>` : ''}
      ${order.payout.screenshotUrl ? `<p style="font-size:13px;"><a href="${order.payout.screenshotUrl}" style="color:#111;font-weight:bold;">View payment screenshot</a></p>` : ''}
      ${btn(`${siteUrl()}/sellers/orders/${order._id}`, 'View Order')}
    `),
  });
}

export function sendAdminProductRequestEmail(sellerName: string, req: { name: string; brand: string; colorway: string; sizes: string[]; supportingUrls: string[]; note: string }) {
  const links = req.supportingUrls.map((u) => `<li><a href="${u}">${u}</a></li>`).join('');
  sendMail({
    to: adminEmail(),
    subject: `Product request from ${sellerName} — ${req.brand} ${req.name}`,
    html: shell(`
      <p style="font-size:16px;font-weight:bold;margin-top:0;">${sellerName} wants to list a product not in the catalog</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#666;width:120px;">Product</td><td style="padding:6px 0;font-weight:bold;">${req.brand} ${req.name}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Colorway</td><td style="padding:6px 0;">${req.colorway || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Sizes</td><td style="padding:6px 0;">${req.sizes.join(', ') || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Note</td><td style="padding:6px 0;">${req.note || '—'}</td></tr>
      </table>
      ${links ? `<p style="font-size:13px;color:#666;margin-bottom:4px;">Supporting links</p><ul style="font-size:13px;">${links}</ul>` : ''}
      ${btn(`${siteUrl()}/admin/product-requests`, 'Review Request →')}
    `, EMAIL_REASON.admin),
  });
}

export function sendSellerProductRequestResultEmail(to: string, name: string, req: { name: string; brand: string; status: string; adminNote: string }, productSlug?: string) {
  const approved = req.status === 'approved';
  sendMail({
    to,
    subject: approved
      ? `${req.brand} ${req.name} is now in the catalog | SNKRS CART`
      : `Update on your product request — ${req.brand} ${req.name} | SNKRS CART`,
    html: shell(`
      <p style="font-size:16px;margin-top:0;">Hi <strong>${name}</strong>,</p>
      ${approved
        ? `<p style="color:#444;"><strong>${req.brand} ${req.name}</strong> has been added to the SNKRS CART catalog. You can now list your sizes and prices for it in the seller portal.</p>`
        : `<p style="color:#444;">We could not add <strong>${req.brand} ${req.name}</strong> to the catalog right now.</p>`}
      ${req.adminNote ? `<div style="background:#fafafa;border-left:3px solid #111;padding:12px 16px;margin:16px 0;font-size:14px;color:#333;">${req.adminNote}</div>` : ''}
      ${productSlug ? `<p style="font-size:13px;color:#666;">Catalog page: <a href="${siteUrl()}/products/${productSlug}">${siteUrl()}/products/${productSlug}</a></p>` : ''}
      ${btn(`${siteUrl()}/sellers/listings`, approved ? 'Add Your Listing' : 'Open Seller Portal')}
    `),
  });
}
