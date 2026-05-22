import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Order, IOrder } from '../models/Order';
import { customerAuth, optionalAuth, AuthRequest } from '../middleware/customerAuth';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { sendMail } from '../lib/mailer';
import { Loyalty, COINS_PER_100, COINS_TO_RUPEE, MAX_REDEEM_PCT, MIN_REDEEM } from '../models/Loyalty';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import Razorpay from 'razorpay';

// Lazy-initialised gateway instances
let _cashfree: InstanceType<typeof Cashfree> | null = null;
function getCashfree() {
  if (!_cashfree) {
    _cashfree = new Cashfree(
      process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
      process.env.CASHFREE_APP_ID || '',
      process.env.CASHFREE_SECRET_KEY || '',
    );
  }
  return _cashfree;
}

let _razorpay: InstanceType<typeof Razorpay> | null = null;
function getRazorpay() {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }
  return _razorpay;
}

function sendAdminNewOrderEmail(order: IOrder, siteUrl: string, paymentMode: string) {
  const storeEmail = process.env.GMAIL_USER || 'infosnkrscart@gmail.com';
  const itemsHtml = (order.items as any[]).map((it) => `
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

  const note = paymentMode === 'manual'
    ? '⚠️ Awaiting UPI payment confirmation from customer. Once received, confirm order in admin panel.'
    : '✅ Payment confirmed via ' + paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1) + '. Order is now confirmed.';

  sendMail({
    to: storeEmail,
    subject: `New Order #${order.orderNumber} — ₹${order.total.toLocaleString('en-IN')} — ${order.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;color:#111;">
        <div style="background:#111;padding:16px 24px;text-align:center;">
          <img src="${siteUrl}/logo.jpg" alt="SNKRS CART" style="height:48px;width:auto;" />
        </div>
        <div style="padding:24px;">
          <p style="font-size:16px;font-weight:bold;margin-top:0;">New Order Received — ${order.orderNumber}</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
            <tr><td style="padding:6px 0;color:#666;width:120px;">Customer</td><td style="padding:6px 0;font-weight:bold;">${order.name}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;"><a href="mailto:${order.email}">${order.email}</a></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Phone</td><td style="padding:6px 0;"><a href="tel:${order.phone}">${order.phone}</a></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Address</td><td style="padding:6px 0;">${order.addressLine}, ${order.city}, ${order.state} — ${order.pincode}</td></tr>
          </table>
          <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
          <table style="width:100%;margin-top:12px;font-size:14px;">
            <tr><td style="padding:4px 0;color:#666;">Subtotal</td><td style="text-align:right;">₹${order.subtotal.toLocaleString('en-IN')}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">Shipping</td><td style="text-align:right;">${order.shipping === 0 ? 'Free' : '₹' + order.shipping.toLocaleString('en-IN')}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;font-size:16px;border-top:2px solid #111;">Total</td><td style="text-align:right;font-weight:bold;font-size:16px;border-top:2px solid #111;">₹${order.total.toLocaleString('en-IN')}</td></tr>
          </table>
          <p style="margin-top:20px;font-size:13px;color:#666;">${note}</p>
          <a href="${siteUrl}/admin/orders" style="display:inline-block;margin-top:12px;background:#111;color:#fff;padding:10px 20px;text-decoration:none;font-size:13px;font-weight:bold;border-radius:6px;">View in Admin Panel →</a>
        </div>
      </div>
    `,
  });
}

function sendPaymentConfirmedEmail(order: IOrder, siteUrl: string) {
  const itemsHtml = (order.items as any[]).map((it) => `
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

  sendMail({
    to: order.email,
    subject: `Payment Confirmed — ${order.orderNumber} | SNKRS CART`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:#111;padding:20px 32px;text-align:center;">
          <img src="${siteUrl}/logo.jpg" alt="SNKRS CART" style="height:56px;width:auto;" />
        </div>
        <div style="padding:32px;">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="font-size:13px;color:#166534;font-weight:bold;margin:0 0 4px;">✅ Payment Confirmed</p>
            <p style="font-size:22px;font-weight:bold;color:#111;margin:0;">₹${order.total.toLocaleString('en-IN')}</p>
          </div>
          <p style="font-size:16px;font-weight:bold;margin-top:0;">Thank you, ${order.name}!</p>
          <p style="color:#444;">Your payment for order <strong>${order.orderNumber}</strong> has been confirmed. We're now processing your order.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:20px;">${itemsHtml}</table>
          <table style="width:100%;margin-top:12px;font-size:14px;">
            <tr><td style="padding:4px 0;color:#666;">Subtotal</td><td style="text-align:right;">₹${order.subtotal.toLocaleString('en-IN')}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">Shipping</td><td style="text-align:right;">${order.shipping === 0 ? 'Free' : '₹' + order.shipping.toLocaleString('en-IN')}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;border-top:2px solid #111;">Total Paid</td><td style="text-align:right;font-weight:bold;border-top:2px solid #111;">₹${order.total.toLocaleString('en-IN')}</td></tr>
          </table>
          <p style="color:#888;font-size:12px;margin-top:32px;">Delivery: 3–7 business days · <a href="${siteUrl}/account/orders" style="color:#888;">Track your order</a></p>
          <p style="color:#888;font-size:12px;">— SNKRS CART Team</p>
        </div>
      </div>
    `,
  });
}

const SHIPPING_THRESHOLD = 3000;
const SHIPPING_COST = 199;

const router = Router();

// POST /api/v1/orders/cashfree/webhook — must be before /:id
router.post('/cashfree/webhook', async (req: Request, res: Response) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp  = req.headers['x-webhook-timestamp'] as string;

    if (!signature || !timestamp) {
      res.status(200).json({ received: true }); // accept test pings without signature
      return;
    }

    let event: any;
    try {
      event = getCashfree().PGVerifyWebhookSignature(signature, rawBody, timestamp);
    } catch {
      res.status(400).json({ error: 'Invalid webhook signature' });
      return;
    }

    const obj = event.object || {};
    const cfOrderId = String(obj.data?.order?.order_id || '');
    if (!cfOrderId) { res.status(200).json({ received: true }); return; }

    const order = await Order.findById(cfOrderId);
    if (!order) { res.status(200).json({ received: true }); return; }

    const paymentStatus = obj.data?.payment?.payment_status as string;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

    if (paymentStatus === 'SUCCESS' && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();
      sendPaymentConfirmedEmail(order, siteUrl);
      sendAdminNewOrderEmail(order, siteUrl, 'cashfree');
    } else if (paymentStatus === 'FAILED' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'failed';
      await order.save();
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Cashfree webhook error:', err);
    res.status(200).json({ received: true }); // always ack to Cashfree
  }
});

// POST /api/v1/orders/razorpay/verify
router.post('/razorpay/verify', async (req: Request, res: Response) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      res.status(400).json({ error: 'Invalid payment signature' });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';
      sendPaymentConfirmedEmail(order, siteUrl);
      sendAdminNewOrderEmail(order, siteUrl, 'razorpay');
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `SC-${timestamp}-${rand}`;
}

async function initCashfreePayment(
  order: IOrder,
  ctx: { name: string; email: string; phone: string; finalTotal: number; orderNumber: string; siteUrl: string },
  userId?: string,
): Promise<{ paymentMode: 'cashfree'; paymentSessionId: string }> {
  try {
    const cfRes = await getCashfree().PGCreateOrder({
      order_id: String(order._id),
      order_amount: ctx.finalTotal,
      order_currency: 'INR',
      customer_details: {
        customer_id: userId || ctx.email.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50),
        customer_name: ctx.name,
        customer_email: ctx.email,
        customer_phone: ctx.phone.replace(/[^0-9]/g, '').slice(-10),
      },
      order_meta: {
        return_url: `${ctx.siteUrl}/checkout/confirmation?id=${order._id}&order=${ctx.orderNumber}&total=${ctx.finalTotal}&paymentStatus=pending`,
      },
    } as any);
    const sessionId = (cfRes as any).data?.payment_session_id || '';
    const cfOrderId = String((cfRes as any).data?.cf_order_id || '');
    await Order.findByIdAndUpdate(order._id, { paymentSessionId: sessionId, cfOrderId });
    return { paymentMode: 'cashfree', paymentSessionId: sessionId };
  } catch (err) {
    console.error('Cashfree order creation failed:', err);
    throw new Error('Payment gateway unavailable. Change PAYMENT_MODE to manual to use UPI.');
  }
}

async function initRazorpayPayment(
  order: IOrder,
  ctx: { finalTotal: number; orderNumber: string },
): Promise<{ paymentMode: 'razorpay'; razorpayOrderId: string; razorpayKeyId: string | undefined; amount: number }> {
  try {
    const rzpOrder = await getRazorpay().orders.create({
      amount: Math.round(ctx.finalTotal * 100),
      currency: 'INR',
      receipt: ctx.orderNumber,
    });
    await Order.findByIdAndUpdate(order._id, { razorpayOrderId: rzpOrder.id });
    return {
      paymentMode: 'razorpay',
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: Math.round(ctx.finalTotal * 100),
    };
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    throw new Error('Payment gateway unavailable. Change PAYMENT_MODE to manual to use UPI.');
  }
}

// POST /api/v1/orders — place a new order (optionally authenticated)
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, addressLine, city, state, pincode, items, subtotal, shipping, total, coinsRedeemed: rawCoinsRedeemed } = req.body;

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
    if (String(name).trim().length > 100 || String(addressLine).trim().length > 300 || String(city).trim().length > 100) {
      res.status(400).json({ error: 'Input fields exceed maximum length' });
      return;
    }
    if (items.length > 20) {
      res.status(400).json({ error: 'Order cannot contain more than 20 items' });
      return;
    }

    // Server-side price recomputation — never trust client-supplied totals
    const uniqueProductIds = [...new Set(items.map((it: any) => it.productId))];
    const products = await Product.find({ _id: { $in: uniqueProductIds } }).lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    let serverSubtotal = 0;
    for (const item of items as any[]) {
      const product = productMap.get(String(item.productId));
      if (!product) {
        res.status(400).json({ error: `Product not found: ${item.productId}` });
        return;
      }
      const variant = product.variants?.find((v) => Number(v.size) === Number(item.size));
      const authPrice = variant?.price ?? product.price;
      serverSubtotal += authPrice * item.qty;
    }
    const serverShipping = serverSubtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const serverTotal = serverSubtotal + serverShipping;

    if (Math.abs(serverTotal - (subtotal + shipping)) > 1) {
      res.status(400).json({ error: 'Order total mismatch. Please refresh and try again.' });
      return;
    }

    // Atomic coin redemption — deduct only if user has sufficient balance
    let coinsRedeemed = 0;
    let coinDiscount = 0;

    if (req.user && rawCoinsRedeemed >= MIN_REDEEM) {
      const requested = Math.floor(rawCoinsRedeemed);
      const rawDiscount = requested * COINS_TO_RUPEE;
      const maxDiscount = Math.floor(serverTotal * MAX_REDEEM_PCT);
      coinDiscount = Math.min(rawDiscount, maxDiscount);
      coinsRedeemed = Math.round(coinDiscount / COINS_TO_RUPEE);

      const updated = await Loyalty.findOneAndUpdate(
        { userId: req.user.id, coins: { $gte: coinsRedeemed } },
        {
          $inc: { coins: -coinsRedeemed },
          $push: { history: { type: 'redeem', amount: coinsRedeemed, reason: 'Order redemption', orderId: 'pending', createdAt: new Date() } },
        },
        { upsert: false, new: true },
      );

      if (!updated) {
        coinDiscount = 0;
        coinsRedeemed = 0;
      }
    }

    const finalTotal = Math.max(0, serverTotal - coinDiscount);
    const coinsEarned = Math.floor(finalTotal / 100) * COINS_PER_100;

    const enrichedItems = (items as any[]).map((item) => ({
      ...item,
      slug: productMap.get(String(item.productId))?.slug ?? '',
    }));

    const orderNumber = generateOrderNumber();
    const order = await Order.create({
      orderNumber, name, email, phone, addressLine, city, state, pincode,
      items: enrichedItems, subtotal, shipping, total: finalTotal, status: 'pending',
      coinsEarned, coinsRedeemed,
      ...(req.user ? { userId: req.user.id } : {}),
    });

    // Patch the loyalty history orderId now that we have the real order._id
    if (req.user && coinsRedeemed > 0) {
      Loyalty.updateOne(
        { userId: req.user.id, 'history.orderId': 'pending' },
        { $set: { 'history.$.orderId': String(order._id) } },
      ).catch(() => {});
    }

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

    const storeEmail = process.env.GMAIL_USER || 'infosnkrscart@gmail.com';
    const storeWA = process.env.NEXT_PUBLIC_WHATSAPP || '919410903791';
    const UPI_ID = process.env.UPI_ID || 'snkrscart@upi';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';
    const paymentMode = (process.env.PAYMENT_MODE || 'manual') as 'cashfree' | 'razorpay' | 'manual';

    const baseResponse = { success: true, orderId: order._id, orderNumber, coinsEarned, coinsRedeemed, finalTotal };

    // Delegate to per-gateway handler
    const gatewayResult = await (
      paymentMode === 'cashfree'  ? initCashfreePayment(order, { name, email, phone, finalTotal, orderNumber, siteUrl }, req.user?.id) :
      paymentMode === 'razorpay'  ? initRazorpayPayment(order, { finalTotal, orderNumber }) :
      /* manual */                  Promise.resolve({ paymentMode: 'manual' as const })
    );

    res.status(201).json({ ...baseResponse, ...gatewayResult });

    const resolvedPaymentMode = gatewayResult.paymentMode;
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

    // Admin email — only for manual (UPI) mode; gateway modes send after payment is confirmed
    if (resolvedPaymentMode === 'manual') {
      sendAdminNewOrderEmail(order, siteUrl, 'manual');
    }

    // Customer UPI instructions email — only for manual mode; gateway modes send after webhook confirms
    if (resolvedPaymentMode !== 'manual') return;
    sendMail({
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
    });

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

// GET /api/v1/orders/lookup?orderNumber=SC-XXX&email=x — lookup by order number + email verification
router.get('/lookup', async (req: Request, res: Response) => {
  try {
    const { orderNumber, email } = req.query as { orderNumber?: string; email?: string };
    if (!orderNumber || !email) { res.status(400).json({ error: 'orderNumber and email are required' }); return; }
    const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase() }).lean();
    if (!order || order.email.toLowerCase() !== email.trim().toLowerCase()) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// GET /api/v1/orders/:id — get order by ID (auth required or email query param)
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const authed = req.user && (order.userId?.toString() === req.user.id || order.email === req.user.email);
    const emailMatch = !req.user && req.query.email && order.email.toLowerCase() === String(req.query.email).trim().toLowerCase();
    if (!authed && !emailMatch) { res.status(403).json({ error: 'Forbidden' }); return; }
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
