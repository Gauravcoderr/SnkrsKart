import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { SiteContent } from '../src/models/SiteContent';

const SHIPPING_HTML = `
<p style="font-size:0.875rem;color:#71717a;margin-bottom:2.5rem;">We ship all orders across India with free delivery. Here's what to expect.</p>

<div style="margin-bottom:2.5rem;">
  <div style="border:1px solid #f4f4f5;padding:1.5rem;margin-bottom:1rem;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
      <div>
        <h2 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.25rem;">Within India</h2>
        <p style="font-size:0.75rem;color:#71717a;">Pan-India delivery via trusted courier partners</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:0.875rem;font-weight:700;color:#18181b;">3–7 Business Days</p>
        <p style="font-size:0.75rem;font-weight:600;color:#059669;">Free on all orders</p>
      </div>
    </div>
  </div>
  <div style="border:1px solid #f4f4f5;padding:1.5rem;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
      <div>
        <h2 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.25rem;">Uttarakhand (Local)</h2>
        <p style="font-size:0.75rem;color:#71717a;">Faster delivery to Pauri Garhwal and nearby areas</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:0.875rem;font-weight:700;color:#18181b;">1–3 Business Days</p>
        <p style="font-size:0.75rem;font-weight:600;color:#059669;">Free</p>
      </div>
    </div>
  </div>
</div>

<section style="margin-bottom:1.5rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">How Shipping Works</h2>
  <ol style="list-style:decimal;padding-left:1.25rem;line-height:2;">
    <li>Submit a purchase inquiry on the product page</li>
    <li>Our team confirms your order within 24 hours via call/WhatsApp</li>
    <li>Payment is collected and the order is dispatched</li>
    <li>You receive a tracking number once shipped</li>
  </ol>
</section>

<section style="margin-bottom:1.5rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Important Notes</h2>
  <ul style="list-style:disc;padding-left:1.25rem;line-height:2;">
    <li>All orders are shipped in secure, tamper-proof packaging</li>
    <li>Delivery times are estimates and may vary during peak seasons</li>
    <li>We are not responsible for delays caused by courier partners or natural events</li>
    <li>Signature may be required upon delivery</li>
  </ul>
</section>

<section>
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Questions?</h2>
  <p>Contact us at <a href="mailto:infosnkrscart@gmail.com">infosnkrscart@gmail.com</a> or WhatsApp us at <a href="tel:+919410903791">+91 94109 03791</a>.</p>
</section>
`.trim();

const RETURNS_HTML = `
<p style="font-size:0.875rem;color:#71717a;margin-bottom:2.5rem;">Last updated: May 2026 · Applies to all orders on snkrscart.com</p>

<div style="background:#18181b;color:#fff;padding:1.5rem;margin-bottom:2.5rem;">
  <h2 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">100% Authentic — Our Promise</h2>
  <p style="font-size:0.875rem;color:#d4d4d8;line-height:1.75;">Every sneaker at SNKRS CART is personally verified for authenticity before dispatch. We photograph the exact pair you will receive and share it with you before confirming your order.</p>
</div>

<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Eligibility for Returns &amp; Refunds</h2>
  <p style="margin-bottom:0.75rem;">We accept return requests in the following situations:</p>
  <ul style="list-style:disc;padding-left:1.25rem;line-height:2;">
    <li><strong>Wrong item received</strong> — item differs from what was confirmed before purchase</li>
    <li><strong>Item arrived damaged</strong> — visible damage caused during shipping</li>
    <li><strong>Authenticity concern</strong> — if you have any doubt about authenticity (all items are verified, but we will resolve any concern)</li>
  </ul>
  <p style="margin-top:0.75rem;">Return requests must be raised within <strong>48 hours of delivery</strong> with clear photos of the issue.</p>
</section>

<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Non-Eligible Returns</h2>
  <ul style="list-style:disc;padding-left:1.25rem;line-height:2;">
    <li>Change of mind after purchase</li>
    <li>Incorrect size selected by the customer (please confirm your size before purchasing)</li>
    <li>Items that have been worn, used, or had their tags removed</li>
  </ul>
</section>

<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Refund Process</h2>
  <ol style="list-style:decimal;padding-left:1.25rem;line-height:2;">
    <li>We will arrange free return pickup from your address</li>
    <li>Once the item is received and inspected, a full refund will be processed</li>
    <li>Refunds are credited within <strong>5–7 business days</strong> via the original payment method</li>
  </ol>
</section>

<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Contact Us</h2>
  <p style="margin-bottom:0.75rem;">To raise a return request or for any query, contact us within 48 hours of delivery:</p>
  <p><a href="mailto:infosnkrscart@gmail.com">infosnkrscart@gmail.com</a></p>
  <p><a href="tel:+919410903791">+91 94109 03791 (WhatsApp / Call)</a></p>
  <p style="font-size:0.75rem;color:#71717a;margin-top:0.25rem;">Available Mon–Sat, 10am–7pm IST</p>
</section>
`.trim();

const TRACK_ORDER_HTML = `
<p style="font-size:0.875rem;color:#71717a;margin-bottom:2.5rem;">Once your order is shipped, you'll receive a tracking number via WhatsApp and email.</p>

<div style="border:1px solid #f4f4f5;padding:1.5rem;margin-bottom:1.5rem;">
  <h2 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:1rem;">How to Track Your Order</h2>
  <ol style="list-style:decimal;padding-left:1.25rem;line-height:2;">
    <li>After dispatch, we'll send your tracking number via WhatsApp/email</li>
    <li>Use the tracking number on the courier partner's website to check status</li>
    <li>Typical delivery: 3–7 business days after dispatch</li>
  </ol>
</div>

<div style="background:#fafafa;border:1px solid #f4f4f5;padding:1.5rem;">
  <h2 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Haven't received your tracking number?</h2>
  <p style="margin-bottom:1rem;">If it's been more than 24 hours since your order was confirmed and you haven't received a tracking update, reach out to us directly:</p>
  <p><a href="mailto:infosnkrscart@gmail.com">infosnkrscart@gmail.com</a></p>
  <p><a href="tel:+919410903791">+91 94109 03791 (WhatsApp / Call)</a></p>
</div>
`.trim();

const PAGES = [
  {
    pageKey: 'shipping',
    label: 'Shipping Info',
    metaTitle: 'Shipping Info | Free Pan-India Delivery | SNKRS CART',
    metaDescription: 'SNKRS CART ships all orders free across India in 3–7 business days. Faster delivery in Uttarakhand. Track your order anytime.',
    metaKeywords: 'free shipping India, SNKRS CART delivery, sneaker delivery India',
    ogTitle: 'Shipping Info | SNKRS CART',
    ogDescription: 'Free pan-India shipping on all sneaker orders. 3–7 business days delivery.',
    htmlContent: SHIPPING_HTML,
    faqItems: [],
  },
  {
    pageKey: 'returns',
    label: 'Returns & Refunds',
    metaTitle: 'Return & Refund Policy | SNKRS CART',
    metaDescription: 'SNKRS CART return policy — damaged or incorrect items eligible for replacement or full refund within 48 hours of delivery. Contact us at infosnkrscart@gmail.com.',
    metaKeywords: 'SNKRS CART return policy, sneaker refund India',
    ogTitle: 'Return & Refund Policy | SNKRS CART',
    ogDescription: 'Damaged or incorrect items eligible for replacement or full refund within 48 hours of delivery.',
    htmlContent: RETURNS_HTML,
    faqItems: [],
  },
  {
    pageKey: 'track-order',
    label: 'Track Order',
    metaTitle: 'Track My Order | SNKRS CART',
    metaDescription: 'Track your SNKRS CART sneaker order. Get real-time updates on your delivery status via WhatsApp and email. Typical delivery: 3–7 business days across India.',
    metaKeywords: 'track order SNKRS CART, sneaker delivery tracking India',
    ogTitle: 'Track My Order | SNKRS CART',
    ogDescription: 'Track your SNKRS CART order. Delivery updates via WhatsApp and email. 3–7 business days across India.',
    htmlContent: TRACK_ORDER_HTML,
    faqItems: [],
  },
];

async function seed() {
  await connectDB();
  console.log('Seeding extra site content...\n');

  for (const page of PAGES) {
    const result = await SiteContent.findOneAndUpdate(
      { pageKey: page.pageKey },
      { $setOnInsert: page },
      { new: true, upsert: true }
    );
    const isNew = result.createdAt?.getTime() === result.updatedAt?.getTime();
    console.log(`  ${page.pageKey.padEnd(14)} → ${isNew ? 'inserted' : 'skipped (already exists)'}`);
  }

  console.log('\nDone.');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
