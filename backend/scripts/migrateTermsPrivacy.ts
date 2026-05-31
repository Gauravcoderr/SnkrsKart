import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { SiteContent } from '../src/models/SiteContent';

const PRIVACY_HTML = `
<p style="margin-bottom:1.5rem;color:#71717a;font-size:0.875rem;">This policy is maintained by SNKRS CART, operated by Ashutosh Lingwal (sole proprietor), as the data controller.</p>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Information We Collect</h2>
  <p>When you create an account, place an order, or interact with SNKRS CART, we may collect your name, email address, phone number, delivery address, and payment details. We also collect browsing data (pages visited, items viewed) to improve your experience. We use this information solely to process your orders and provide customer support.</p>
</section>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">How We Use Your Information</h2>
  <ul style="list-style:disc;padding-left:1.25rem;line-height:2;">
    <li>To process orders, payments, and arrange delivery</li>
    <li>To send order confirmation, shipping updates, and support communication</li>
    <li>To maintain your account and order history</li>
    <li>To improve our website, products, and services</li>
    <li>We do not sell, trade, or rent your personal information to third parties</li>
  </ul>
</section>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Data Security</h2>
  <p>We implement appropriate security measures to protect your personal information. Your data is stored securely and accessed only by authorised personnel.</p>
</section>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Cookies</h2>
  <p>Our website may use cookies to enhance your browsing experience. These are used to remember your preferences and understand how visitors use our site. You can disable cookies through your browser settings.</p>
</section>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Contact Us</h2>
  <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:infosnkrscart@gmail.com">infosnkrscart@gmail.com</a> or call <a href="tel:+919410903791">+91 94109 03791</a>.</p>
</section>
<p style="font-size:0.75rem;color:#a1a1aa;padding-top:1rem;border-top:1px solid #f4f4f5;">Last updated: May 2026</p>
`.trim();

const TERMS_HTML = `
<p style="margin-bottom:1.5rem;color:#71717a;font-size:0.875rem;">SNKRS CART is owned and operated by Ashutosh Lingwal, a sole proprietor.</p>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Acceptance of Terms</h2>
  <p>By accessing and using SNKRS CART, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.</p>
</section>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Purchase Process</h2>
  <p>SNKRS CART is a fully operational online store. You can browse products, add items to your cart, and complete your purchase through our secure checkout. Orders are confirmed immediately upon successful payment. We dispatch all orders within 1–2 business days and send tracking details once shipped.</p>
</section>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Product Authenticity</h2>
  <p>All products sold by SNKRS CART are 100% authentic. We source our inventory from authorised retailers and verified distributors. Every sneaker is personally inspected before dispatch. If you have any authenticity concern after receiving your order, contact us immediately and we will resolve it.</p>
</section>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Pricing</h2>
  <p>All prices displayed on snkrscart.com are in Indian Rupees (INR) and are fixed as shown at the time of purchase. Prices include all applicable taxes. We reserve the right to update prices at any time, but the price at checkout is the price you pay.</p>
</section>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Returns &amp; Cancellations</h2>
  <p>Please review our <a href="/returns">Returns &amp; Exchanges</a> policy for full details on cancellations and returns.</p>
</section>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Limitation of Liability</h2>
  <p>SNKRS CART shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products purchased through us.</p>
</section>
<section style="margin-bottom:2rem;">
  <h2 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#18181b;margin-bottom:0.75rem;">Contact</h2>
  <p>Questions about these Terms? Reach us at <a href="mailto:infosnkrscart@gmail.com">infosnkrscart@gmail.com</a>.</p>
</section>
<p style="font-size:0.75rem;color:#a1a1aa;padding-top:1rem;border-top:1px solid #f4f4f5;">Last updated: May 2026</p>
`.trim();

async function migrate() {
  await connectDB();
  console.log('Migrating terms and privacy content in DB...\n');

  const termsResult = await SiteContent.updateOne(
    { pageKey: 'terms' },
    {
      $set: {
        htmlContent: TERMS_HTML,
        metaDescription: "Terms of Service for SNKRS CART — India's authentic sneaker store. Read about our purchase process, pricing, return policy, and product authenticity guarantee.",
        ogDescription: 'Fixed prices, 100% authentic products, and transparent policies at SNKRS CART.',
      },
    }
  );
  console.log(`  terms    → matched: ${termsResult.matchedCount}, modified: ${termsResult.modifiedCount}`);

  const privacyResult = await SiteContent.updateOne(
    { pageKey: 'privacy' },
    { $set: { htmlContent: PRIVACY_HTML } }
  );
  console.log(`  privacy  → matched: ${privacyResult.matchedCount}, modified: ${privacyResult.modifiedCount}`);

  console.log('\nDone.');
  await mongoose.disconnect();
}

migrate().catch((err) => { console.error(err); process.exit(1); });
