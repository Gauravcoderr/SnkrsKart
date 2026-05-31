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

const ABOUT_HTML = `
<section style="border-bottom:1px solid #27272a;padding:6rem 0;">
  <p style="font-size:0.625rem;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;color:#71717a;margin-bottom:1rem;">Est. 2020 · Pauri Garhwal, Uttarakhand</p>
  <h1 style="font-family:sans-serif;font-weight:900;text-transform:uppercase;line-height:1;letter-spacing:-0.05em;color:#fff;margin-bottom:1.5rem;font-size:clamp(3.5rem,10vw,9rem);">BUILT ON<br><span style="color:#52525b;">PASSION.</span></h1>
  <p style="font-size:1.125rem;color:#a1a1aa;max-width:36rem;line-height:1.75;">We didn't start in a warehouse. We started in the hills — a couple of sneakerheads from Pauri Garhwal who couldn't stop obsessing over kicks.</p>
</section>
<section style="padding:5rem 0;border-bottom:1px solid #27272a;">
  <p style="font-size:0.625rem;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:#71717a;margin-bottom:1.5rem;">Our Story</p>
  <h2 style="font-size:1.875rem;font-weight:900;text-transform:uppercase;letter-spacing:-0.025em;margin-bottom:1.5rem;">From the mountains<br>to your doorstep.</h2>
  <p style="font-size:0.875rem;color:#a1a1aa;line-height:1.75;margin-bottom:1rem;">SNKRS CART was founded in 2020 out of a simple frustration — getting legit, premium sneakers in the hills of Uttarakhand was nearly impossible. Fakes were everywhere. Good stuff was out of reach.</p>
  <p style="font-size:0.875rem;color:#a1a1aa;line-height:1.75;margin-bottom:1rem;">So we fixed it ourselves. What started as a passion project between friends became a curated destination for sneaker lovers who refuse to compromise on authenticity.</p>
  <p style="font-size:0.875rem;color:#a1a1aa;line-height:1.75;">Every pair we carry is verified. Every drop is real. Because we're collectors first — and we know what it means to get burned by a bad pair.</p>
</section>
<section style="padding:5rem 0;border-bottom:1px solid #27272a;">
  <p style="font-size:0.625rem;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:#71717a;margin-bottom:2.5rem;">What we stand for</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;">
    <div style="border:1px solid #27272a;padding:1.5rem;">
      <h3 style="font-size:0.875rem;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff;margin-bottom:0.75rem;">100% Legit</h3>
      <p style="font-size:0.875rem;color:#71717a;line-height:1.75;">Every sneaker is verified for authenticity before it reaches you. No fakes. Ever.</p>
    </div>
    <div style="border:1px solid #27272a;padding:1.5rem;">
      <h3 style="font-size:0.875rem;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff;margin-bottom:0.75rem;">Real Passion</h3>
      <p style="font-size:0.875rem;color:#71717a;line-height:1.75;">We're collectors who turned obsession into a business. This isn't just retail — it's love.</p>
    </div>
    <div style="border:1px solid #27272a;padding:1.5rem;">
      <h3 style="font-size:0.875rem;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff;margin-bottom:0.75rem;">From the Hills</h3>
      <p style="font-size:0.875rem;color:#71717a;line-height:1.75;">Rooted in Pauri Garhwal, Uttarakhand. Proving that sneaker culture has no boundaries.</p>
    </div>
  </div>
</section>
<section style="padding:5rem 0;">
  <p style="font-size:0.625rem;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:#71717a;margin-bottom:1.5rem;">Get in touch</p>
  <h2 style="font-size:1.875rem;font-weight:900;text-transform:uppercase;letter-spacing:-0.025em;margin-bottom:2.5rem;">Contact Us</h2>
  <p><strong>Email:</strong> <a href="mailto:infosnkrscart@gmail.com">infosnkrscart@gmail.com</a></p>
  <p><strong>Phone / WhatsApp:</strong> <a href="tel:+919410903791">+91 94109 03791</a> &mdash; Mon–Sat, 10am–7pm IST</p>
  <p><strong>Based in:</strong> Pauri Garhwal, Uttarakhand, India</p>
</section>
`.trim();

const FAQ_ITEMS = [
  { q: 'Are all products 100% authentic?', a: 'Yes, absolutely. Every sneaker sold on SNKRS CART is 100% authentic and sourced from authorised retailers and verified distributors. We personally inspect each pair before dispatch.' },
  { q: 'How do I purchase a sneaker?', a: 'Click "Want to Purchase? — Enquire Now" on any product page, fill in your details, and submit. Our team will contact you within 24 hours to confirm availability and complete the purchase via WhatsApp or call.' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI, debit/credit cards, net banking, and other online payment methods. Payment is completed securely at checkout during your order.' },
  { q: 'How long does delivery take?', a: 'Orders are typically delivered within 3–7 business days across India. Customers in Uttarakhand may receive their orders in 1–3 business days.' },
  { q: 'Do you ship across India?', a: 'Yes, we ship pan-India with free delivery on all orders.' },
  { q: 'Can I return or exchange my order?', a: 'All sales are final. We do not accept returns or exchanges — every pair is verified authentic and shown to you before purchase is confirmed. If you receive a wrong or damaged item, contact us within 48 hours of delivery with photos and we will replace it or issue a full refund.' },
  { q: 'What sizes are listed in?', a: 'All sizes on SNKRS CART are listed in UK sizing. Visit our Size Guide page to convert to your local size (US, EU, CM).' },
  { q: 'How do I know if a size is available?', a: 'Available sizes are shown on each product page. Greyed-out sizes are currently unavailable. Contact us if you need a size not listed — we may be able to source it.' },
  { q: 'Where are you based?', a: 'SNKRS CART was founded in Pauri Garhwal, Uttarakhand in 2020. We ship across India from our base in the hills.' },
  { q: 'How can I contact you?', a: 'Email us at infosnkrscart@gmail.com or WhatsApp/call us at +91 94109 03791. We typically respond within a few hours.' },
];

const PAGES = [
  {
    pageKey: 'home',
    label: 'Homepage',
    metaTitle: 'SNKRS CART | Buy Authentic Sneakers, Streetwear & Accessories in India.',
    metaDescription: 'Shop 100% authentic sneakers, streetwear, bags & accessories in India. Trusted reselling platform with secure packaging and fast delivery.',
    metaKeywords: 'buy sneakers India, authentic sneakers India, Nike shoes India, Jordan shoes India, Adidas sneakers India, New Balance India, SNKRS CART, sneakers online India, original shoes India',
    ogTitle: 'SNKRS CART | Buy Authentic Sneakers in India',
    ogDescription: 'Shop 100% authentic sneakers in India. Nike, Jordan, Adidas, New Balance & Crocs. Fast delivery, secure checkout.',
    htmlContent: '',
    faqItems: [],
  },
  {
    pageKey: 'faq',
    label: 'FAQs',
    metaTitle: 'FAQs | SNKRS CART',
    metaDescription: "Got questions? Find answers about authenticity, ordering, payment, shipping, returns, sizing, and more at SNKRS CART — India's trusted sneaker store.",
    metaKeywords: 'SNKRS CART FAQ, sneaker store FAQ India, authentic sneakers FAQ',
    ogTitle: 'FAQs | SNKRS CART',
    ogDescription: "Answers about authenticity, ordering, payment, shipping, returns, sizing, and more at SNKRS CART.",
    htmlContent: '',
    faqItems: FAQ_ITEMS,
  },
  {
    pageKey: 'privacy',
    label: 'Privacy Policy',
    metaTitle: 'Privacy Policy | SNKRS CART',
    metaDescription: 'Read the SNKRS CART privacy policy. We collect only what is needed to process your order and never sell your personal information to third parties.',
    metaKeywords: 'SNKRS CART privacy policy',
    ogTitle: 'Privacy Policy | SNKRS CART',
    ogDescription: 'We collect only what is needed to process your order and never sell your personal information.',
    htmlContent: PRIVACY_HTML,
    faqItems: [],
  },
  {
    pageKey: 'about',
    label: 'About Us',
    metaTitle: "About SNKRS CART | India's Authentic Sneaker Store",
    metaDescription: 'Founded in Pauri Garhwal, Uttarakhand in 2020 by sneakerheads who refused to settle for fakes. SNKRS CART delivers 100% authentic Nike, Jordan, Adidas & more across India.',
    metaKeywords: 'about SNKRS CART, authentic sneakers India, sneaker store India, Nike Jordan Adidas India',
    ogTitle: "About SNKRS CART | India's Authentic Sneaker Store",
    ogDescription: 'Founded in Pauri Garhwal, Uttarakhand. 100% authentic Nike, Jordan, Adidas & more. No fakes, no compromise.',
    htmlContent: ABOUT_HTML,
    faqItems: [],
  },
  {
    pageKey: 'terms',
    label: 'Terms & Conditions',
    metaTitle: 'Terms of Service | SNKRS CART',
    metaDescription: "Terms of Service for SNKRS CART — India's authentic sneaker store. Read about our purchase process, pricing, return policy, and product authenticity guarantee.",
    metaKeywords: 'SNKRS CART terms of service',
    ogTitle: 'Terms of Service | SNKRS CART',
    ogDescription: 'Fixed prices, 100% authentic products, and transparent policies at SNKRS CART.',
    htmlContent: TERMS_HTML,
    faqItems: [],
  },
  {
    pageKey: 'products',
    label: 'Products',
    metaTitle: 'Shop Authentic Sneakers | SNKRS CART',
    metaDescription: 'Browse 100% authentic Nike, Jordan, Adidas, New Balance & Crocs. Pan-India shipping with free delivery on all orders.',
    metaKeywords: 'buy Nike sneakers India, authentic Jordan shoes, Adidas shoes India, New Balance India, Crocs India',
    ogTitle: 'Shop Authentic Sneakers | SNKRS CART',
    ogDescription: 'Nike, Jordan, Adidas, New Balance & Crocs — 100% authentic. Pan-India delivery.',
    htmlContent: '',
    faqItems: [],
  },
  {
    pageKey: 'brands',
    label: 'Brands',
    metaTitle: 'Sneaker Brands | SNKRS CART',
    metaDescription: 'Shop by brand at SNKRS CART — Nike, Air Jordan, Adidas, New Balance & Crocs. All 100% authentic with pan-India delivery.',
    metaKeywords: 'Nike India, Jordan India, Adidas India, New Balance India, Crocs India, sneaker brands',
    ogTitle: 'Sneaker Brands | SNKRS CART',
    ogDescription: 'Nike, Jordan, Adidas, New Balance & Crocs — shop by brand at SNKRS CART.',
    htmlContent: '',
    faqItems: [],
  },
  {
    pageKey: 'blogs',
    label: 'Blogs',
    metaTitle: 'Sneaker News & Blog | SNKRS CART',
    metaDescription: 'Latest sneaker news, release guides, style tips and sneakerhead culture from SNKRS CART.',
    metaKeywords: 'sneaker blog India, sneaker news India, Jordan releases, Nike drops India',
    ogTitle: 'Sneaker News & Blog | SNKRS CART',
    ogDescription: 'Latest sneaker news, release guides and culture from India\'s authentic sneaker store.',
    htmlContent: '',
    faqItems: [],
  },
  {
    pageKey: 'drops',
    label: 'Drop Calendar',
    metaTitle: 'Upcoming Sneaker Drops | SNKRS CART',
    metaDescription: 'Never miss a release. See upcoming Nike, Jordan, Adidas & New Balance drops coming to India on SNKRS CART.',
    metaKeywords: 'sneaker drops India, upcoming Nike releases India, Jordan release dates India',
    ogTitle: 'Upcoming Sneaker Drops | SNKRS CART',
    ogDescription: 'Upcoming Nike, Jordan, Adidas & New Balance drops — India release dates.',
    htmlContent: '',
    faqItems: [],
  },
  {
    pageKey: 'sneakers',
    label: 'Sneaker Guide',
    metaTitle: 'Sneaker Guide & Profiles | SNKRS CART',
    metaDescription: 'In-depth profiles on iconic sneaker models — history, colourways, sizing and more. Your guide to sneaker culture in India.',
    metaKeywords: 'sneaker guide India, Nike Air Force 1 guide, Jordan 1 history, Adidas Samba guide',
    ogTitle: 'Sneaker Guide | SNKRS CART',
    ogDescription: 'In-depth profiles on iconic sneaker models. History, colourways, sizing and culture.',
    htmlContent: '',
    faqItems: [],
  },
];

async function seed() {
  await connectDB();
  console.log('Seeding site content...\n');

  for (const page of PAGES) {
    const result = await SiteContent.findOneAndUpdate(
      { pageKey: page.pageKey },
      { $setOnInsert: page },
      { new: true, upsert: true }
    );
    const action = result.createdAt?.getTime() === result.updatedAt?.getTime() ? 'inserted' : 'skipped (already exists)';
    console.log(`  ${page.pageKey.padEnd(12)} → ${action}`);
  }

  console.log('\nDone.');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
