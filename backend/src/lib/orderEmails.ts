import { IOrder } from '../models/Order';
import { sendMail } from './mailer';

export function sendOrderCancelledEmail(order: IOrder, siteUrl: string, reason?: string) {
  sendMail({
    to: order.email,
    subject: `Order Cancelled — ${order.orderNumber} | SNKRS CART`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:#111;padding:20px 32px;text-align:center;">
          <img src="${siteUrl}/logo.jpg" alt="SNKRS CART" style="height:56px;width:auto;" />
        </div>
        <div style="padding:32px;">
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="font-size:13px;color:#991b1b;font-weight:bold;margin:0 0 4px;">Order Cancelled</p>
            <p style="font-size:22px;font-weight:bold;color:#111;margin:0;">${order.orderNumber}</p>
          </div>
          <p style="font-size:16px;font-weight:bold;margin-top:0;">Hi ${order.name},</p>
          <p style="color:#444;">Your order <strong>${order.orderNumber}</strong> for ₹${order.total.toLocaleString('en-IN')} has been cancelled.</p>
          ${reason ? `
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin:16px 0;">
            <p style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin:0 0 4px;">Reason</p>
            <p style="font-size:14px;color:#111;margin:0;">${reason}</p>
          </div>` : ''}
          <p style="color:#444;">If any payment was made for this order, it will be refunded to your original payment method within 5–7 business days. If you have questions, reply to this email or reach out via our support channels.</p>
          <p style="color:#888;font-size:12px;margin-top:32px;"><a href="${siteUrl}/account/orders" style="color:#888;">View your orders</a></p>
          <p style="color:#888;font-size:12px;">— SNKRS CART Team</p>
        </div>
      </div>
    `,
  });
}

export function sendReviewRequestEmail(order: IOrder, siteUrl: string) {
  const gbpUrl = process.env.GBP_REVIEW_URL?.trim() || 'https://g.page/r/CQyHw6Rl_xHBECE/review';
  const items = (order.items || []).filter((it) => it.slug);
  if (items.length === 0 && !gbpUrl) return;

  const itemRows = items.map((it) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;">
                ${it.image ? `<img src="${it.image}" alt="" width="56" height="56" style="border-radius:6px;object-fit:cover;vertical-align:middle;margin-right:12px;" />` : ''}
                <span style="font-size:14px;font-weight:bold;color:#111;vertical-align:middle;">${it.brand ? `${it.brand} ` : ''}${it.name}</span>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">
                <a href="${siteUrl}/products/${it.slug}#reviews" style="display:inline-block;background:#111;color:#fff;font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;padding:10px 14px;border-radius:4px;text-decoration:none;">Write a review</a>
              </td>
            </tr>`).join('');

  sendMail({
    to: order.email,
    subject: `How are the kicks? Leave a review — ${order.orderNumber} | SNKRS CART`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:#111;padding:20px 32px;text-align:center;">
          <img src="${siteUrl}/logo.jpg" alt="SNKRS CART" style="height:56px;width:auto;" />
        </div>
        <div style="padding:32px;">
          <p style="font-size:16px;font-weight:bold;margin-top:0;">Hi ${order.name},</p>
          <p style="color:#444;">Your order <strong>${order.orderNumber}</strong> has been delivered. Two minutes of your time helps the next buyer trust us the way you did.</p>
          ${items.length ? `
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">${itemRows}
          </table>` : ''}
          ${gbpUrl ? `
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
            <p style="font-size:13px;color:#444;margin:0 0 10px;">Happy with SNKRS CART overall?</p>
            <a href="${gbpUrl}" style="display:inline-block;background:#1a73e8;color:#fff;font-size:12px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;padding:12px 18px;border-radius:4px;text-decoration:none;">Review us on Google</a>
          </div>` : ''}
          <p style="color:#444;">Anything wrong with the pair? Reply to this email first and we will sort it out.</p>
          <p style="color:#888;font-size:12px;margin-top:32px;"><a href="${siteUrl}/account/orders" style="color:#888;">View your orders</a></p>
          <p style="color:#888;font-size:12px;">— SNKRS CART Team</p>
        </div>
      </div>
    `,
  });
}
