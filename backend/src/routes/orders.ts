import { Router, Request, Response } from 'express';
import { Resend } from 'resend';
import { Order } from '../models/Order';
import { customerAuth, optionalAuth, AuthRequest } from '../middleware/customerAuth';
import { User } from '../models/User';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SC-${timestamp}-${rand}`;
}

// POST /api/v1/orders — place a new order (optionally authenticated)
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, addressLine, city, state, pincode, items, subtotal, shipping, total } = req.body;

    if (!name || !email || !phone || !addressLine || !city || !state || !pincode) {
      res.status(400).json({ error: 'All contact and address fields are required' });
      return;
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Order must contain at least one item' });
      return;
    }
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
    if (!emailValid) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    const orderNumber = generateOrderNumber();
    const order = await Order.create({
      orderNumber, name, email, phone, addressLine, city, state, pincode,
      items, subtotal, shipping, total, status: 'pending',
      ...(req.user ? { userId: req.user.id } : {}),
    });

    // Save address to user profile if authenticated
    if (req.user) {
      User.findById(req.user.id).then((user) => {
        if (user) {
          const exists = user.addresses.some((a) =>
            a.addressLine === addressLine && a.city === city && a.pincode === pincode
          );
          if (!exists) {
            user.addresses.push({ addressLine, city, state, pincode, isDefault: user.addresses.length === 0 });
            user.save().catch(() => {});
          }
        }
      }).catch(() => {});
    }

    res.status(201).json({ success: true, orderId: order._id, orderNumber });

    const FROM = process.env.RESEND_FROM || 'SNKRS CART <onboarding@resend.dev>';
    const storeEmail = process.env.GMAIL_USER || 'infosnkrscart@gmail.com';
    const storeWA = process.env.NEXT_PUBLIC_WHATSAPP || '919410903791';
    const UPI_ID = process.env.UPI_ID || 'snkrscart@upi';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

    const itemsHtml = items.map((it: { image: string; brand: string; name: string; size: string; qty: number; price: number }) => `
      <tr>
        <td style="padding:8px 4px;border-bottom:1px solid #f0f0f0;">
          ${it.image ? `<img src="${it.image}" width="48" height="48" style="object-fit:contain;border-radius:6px;background:#f9f9f9;" />` : ''}
        </td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:13px;">
          <strong>${it.brand}</strong> ${it.name}<br/>
          <span style="color:#888;">Size: ${it.size} · Qty: ${it.qty}</span>
        </td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;font-weight:bold;">
          ₹${(it.price * it.qty).toLocaleString('en-IN')}
        </td>
      </tr>
    `).join('');

    // Email to store owner
    resend.emails.send({
      from: FROM,
      to: storeEmail,
      subject: `New Order #${orderNumber} — ₹${total.toLocaleString('en-IN')} — ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;color:#111;">
          <div style="background:#111;padding:16px 24px;text-align:center;">
            <img src="${siteUrl}/logo.jpg" alt="SNKRS CART" style="height:48px;width:auto;" />
          </div>
          <div style="padding:24px;">
            <p style="font-size:16px;font-weight:bold;margin-top:0;">New Order Received — ${orderNumber}</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
              <tr><td style="padding:6px 0;color:#666;width:120px;">Customer</td><td style="padding:6px 0;font-weight:bold;">${name}</td></tr>
              <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:6px 0;color:#666;">Phone</td><td style="padding:6px 0;"><a href="tel:${phone}">${phone}</a></td></tr>
              <tr><td style="padding:6px 0;color:#666;">Address</td><td style="padding:6px 0;">${addressLine}, ${city}, ${state} — ${pincode}</td></tr>
            </table>
            <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
            <table style="width:100%;margin-top:12px;font-size:14px;">
              <tr><td style="padding:4px 0;color:#666;">Subtotal</td><td style="text-align:right;">₹${subtotal.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding:4px 0;color:#666;">Shipping</td><td style="text-align:right;">${shipping === 0 ? 'Free' : '₹' + shipping.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold;font-size:16px;border-top:2px solid #111;">Total</td><td style="text-align:right;font-weight:bold;font-size:16px;border-top:2px solid #111;">₹${total.toLocaleString('en-IN')}</td></tr>
            </table>
            <p style="margin-top:20px;font-size:13px;color:#666;">⚠️ Awaiting UPI payment confirmation from customer. Once received, confirm order in admin panel.</p>
            <a href="${siteUrl}/admin/orders" style="display:inline-block;margin-top:12px;background:#111;color:#fff;padding:10px 20px;text-decoration:none;font-size:13px;font-weight:bold;border-radius:6px;">View in Admin Panel →</a>
          </div>
        </div>
      `,
    }).catch((err: unknown) => console.error('Order store email failed:', err));

    // Confirmation email to customer
    resend.emails.send({
      from: FROM,
      to: email,
      subject: `Order Confirmed — ${orderNumber} | SNKRS CART`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
          <div style="background:#111;padding:20px 32px;text-align:center;">
            <img src="${siteUrl}/logo.jpg" alt="SNKRS CART" style="height:56px;width:auto;" />
          </div>
          <div style="padding:32px;">
            <p style="font-size:18px;font-weight:bold;margin-top:0;">Thank you, ${name}!</p>
            <p style="color:#444;">Your order <strong>${orderNumber}</strong> has been placed. Please complete the payment via UPI to confirm your order.</p>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
              <p style="font-size:13px;color:#166534;font-weight:bold;margin:0 0 8px;">Complete Your Payment</p>
              <p style="font-size:28px;font-weight:black;color:#111;margin:0 0 4px;">₹${total.toLocaleString('en-IN')}</p>
              <p style="font-size:15px;color:#333;margin:0 0 12px;">Pay to UPI ID: <strong>${UPI_ID}</strong></p>
              <p style="font-size:12px;color:#666;margin:0;">Use PhonePe · Google Pay · Paytm · any UPI app</p>
            </div>

            <p style="font-size:13px;color:#666;background:#fafafa;border-radius:8px;padding:14px;">
              After payment, send a screenshot on WhatsApp at
              <a href="https://wa.me/${storeWA}?text=Order+${orderNumber}+payment+done" style="color:#25D366;font-weight:bold;">+91 94109 03791</a>
              with your order number <strong>${orderNumber}</strong>. We'll confirm within 1 hour.
            </p>

            <table style="width:100%;border-collapse:collapse;margin-top:20px;">${itemsHtml}</table>
            <table style="width:100%;margin-top:12px;font-size:14px;">
              <tr><td style="padding:4px 0;color:#666;">Subtotal</td><td style="text-align:right;">₹${subtotal.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding:4px 0;color:#666;">Shipping</td><td style="text-align:right;">${shipping === 0 ? 'Free' : '₹' + shipping.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold;border-top:2px solid #111;">Total</td><td style="text-align:right;font-weight:bold;border-top:2px solid #111;">₹${total.toLocaleString('en-IN')}</td></tr>
            </table>

            <p style="color:#888;font-size:12px;margin-top:32px;">Delivery: 3–7 business days after payment confirmation · <a href="${siteUrl}/returns" style="color:#888;">Returns policy</a></p>
            <p style="color:#888;font-size:12px;">— SNKRS CART Team, Pauri Garhwal, Uttarakhand</p>
          </div>
        </div>
      `,
    }).catch((err: unknown) => console.error('Order confirm email failed:', err));

  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /api/v1/orders/my — get logged-in user's orders
router.get('/my', customerAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ userId: req.user!.id }).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/v1/orders/lookup?orderNumber=SC-XXX — lookup by order number
router.get('/lookup', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.query as { orderNumber?: string };
    if (!orderNumber) { res.status(400).json({ error: 'orderNumber is required' }); return; }
    const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase() }).lean();
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// GET /api/v1/orders/:id — get order by ID (for confirmation page)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
