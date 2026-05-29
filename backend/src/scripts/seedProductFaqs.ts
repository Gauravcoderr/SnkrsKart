import 'dotenv/config';
import { connectDB } from '../config/database';
import { Product } from '../models/Product';

const BRAND_FAQS: Record<string, Array<{ question: string; answer: string }>> = {
  Nike: [
    {
      question: 'Do Nike shoes run true to size?',
      answer: 'Most Nike lifestyle sneakers (Air Force 1, Air Max 270) run true to size. Performance models (Air Zoom, React) run half a size small — size up if you are between sizes. Check the available sizes listed on this product page.',
    },
    {
      question: 'How do I clean Nike sneakers?',
      answer: 'Use a soft brush with mild soap and cold water. Remove laces before cleaning. Avoid machine washing — heat and agitation can break down the foam midsole and glue. Air dry away from direct sunlight.',
    },
    {
      question: 'Are Nike sneakers good for daily wear?',
      answer: 'Yes. Nike lifestyle sneakers are built for all-day comfort with cushioned midsoles and breathable uppers. Models like Air Max 270 and Air Force 1 are popular daily drivers across India.',
    },
    {
      question: 'How do I check if my Nike sneakers are authentic?',
      answer: 'Check the SKU on the box label against the tag inside the tongue — they must match exactly. Look for even stitching, clean Swoosh edges, and clear text on the insole. All pairs from SNKRS CART are 100% verified authentic before dispatch.',
    },
    {
      question: 'What is the warranty on Nike shoes?',
      answer: 'Nike covers manufacturing defects (sole separation, stitching failures, material defects) for 2 years from purchase. Normal wear, water damage, and modifications are not covered. Contact infosnkrscart@gmail.com for warranty claims.',
    },
  ],

  Jordan: [
    {
      question: 'Do Air Jordan sneakers run true to size?',
      answer: 'Most Air Jordan models run half a size small. We recommend sizing up 0.5 from your normal size — especially for Jordan 1, Jordan 4, and Jordan 11. For example, if you normally wear US 9, order US 9.5.',
    },
    {
      question: 'How long does it take to break in Air Jordans?',
      answer: 'Jordan 1s and 4s typically take 1–2 weeks of regular wear to fully break in. The leather upper softens with use. Wearing thick socks during the first few wears helps speed up the process without damaging the shape.',
    },
    {
      question: 'How do I spot fake Air Jordans?',
      answer: 'Check the Jumpman logo — it should be sharp and well-defined, not blurry or uneven. The SKU on the box must match the insole tag exactly. Leather should feel firm and consistent. All Air Jordans from SNKRS CART come with original box, extra laces, and pre-dispatch authenticity verification.',
    },
    {
      question: 'Are Air Jordans good for basketball or just fashion?',
      answer: 'Retro Jordan models (1, 3, 4, 11) are lifestyle and fashion sneakers — they are not designed for on-court performance. If you need a basketball shoe, look at Jordan\'s current performance line. Retros are built for comfort and streetwear.',
    },
    {
      question: 'Do Jordan sneakers increase in value over time?',
      answer: 'Limited colorways and retro releases often appreciate in resale value — especially OG and "Bred" colorways. Condition, original box, and accessories significantly impact resale price. Buy what you love to wear, not just to hold.',
    },
  ],

  Adidas: [
    {
      question: 'Do Adidas sneakers run true to size?',
      answer: 'Adidas sneakers generally run true to size. Ultraboost and NMD models can feel slightly narrow — if you have wider feet, size up half a size. Stan Smith and Samba are true to size for most customers.',
    },
    {
      question: 'How do I clean Adidas Boost midsoles?',
      answer: 'Use a Magic Eraser or whitening toothpaste on a soft brush for the Boost midsole. Clean the upper with mild soap and a damp cloth. Let air dry completely — avoid direct heat, which can yellow the Boost foam over time.',
    },
    {
      question: 'What is Boost technology and why does it matter?',
      answer: 'Boost is Adidas\'s proprietary foam made of fused thermoplastic polyurethane pellets. It returns more energy with each step than standard EVA foam, making it one of the most comfortable everyday midsoles available.',
    },
    {
      question: 'Are Adidas sneakers suitable for running?',
      answer: 'Running-specific Adidas models (Ultraboost 24, Adizero) are built for performance use. Lifestyle models (Samba, Stan Smith, NMD) are comfort sneakers — fine for walking and daily wear but not designed for sustained running.',
    },
    {
      question: 'How do I verify Adidas authenticity?',
      answer: 'The article number on the box must match the tag inside the tongue. Three Stripes should be even, parallel, and cleanly stitched. The Trefoil or Adidas wordmark should be sharp with no ink bleeding. All our pairs are verified authentic before dispatch.',
    },
  ],

  'New Balance': [
    {
      question: 'Do New Balance shoes run wide or narrow?',
      answer: 'New Balance is known for offering wide widths (2E, 4E) — a major advantage for customers with wider feet. Standard D width is true to size. If you have narrow feet, consider going half a size down.',
    },
    {
      question: 'What makes New Balance 550 and 990 popular?',
      answer: 'The 550 is a retro basketball silhouette with a clean, minimal design — popular in streetwear. The 990 is made in the USA with premium materials and is New Balance\'s most cushioned lifestyle sneaker. Both are daily-wear favourites.',
    },
    {
      question: 'How long do New Balance sneakers last?',
      answer: 'With proper care, New Balance lifestyle sneakers last 1.5–3 years of regular wear. The ENCAP midsole technology in the 99x series is particularly durable. Rotating between two pairs extends the lifespan of both.',
    },
    {
      question: 'Are New Balance sneakers suitable for flat feet?',
      answer: 'Many New Balance models (860, 990) offer strong arch support and motion control — making them popular with customers who have flat feet or overpronation. Check the product description for arch support level on each model.',
    },
    {
      question: 'How do I clean suede New Balance sneakers?',
      answer: 'Use a dry suede brush to remove dirt — never wet suede directly. For stains, use a suede eraser. After cleaning, apply a suede protector spray. Avoid wearing suede in rain — water stains are difficult to remove from suede.',
    },
  ],

  Crocs: [
    {
      question: 'Should I size up or down for Crocs?',
      answer: 'Crocs generally run large. Most customers size down half to one full size. If you are between sizes, size down. Crocs are designed with a roomy fit — they remain comfortable and breathable even in a snug fit.',
    },
    {
      question: 'Are Crocs actually comfortable for all-day wear?',
      answer: 'Yes. Crocs are made from Croslite, a proprietary closed-cell resin that is lightweight, shock-absorbing, and odour-resistant. Many healthcare workers wear them for 12-hour shifts. The clog style provides more foot support than flip-flops.',
    },
    {
      question: 'Can Crocs be worn in water?',
      answer: 'Yes. Crocs are fully waterproof and quick-drying. The Classic Clog is popular for beach, pool, and outdoor use. The ventilation holes allow water to drain quickly. Avoid leaving Crocs in direct sun for extended periods — heat can cause slight shrinkage.',
    },
    {
      question: 'How do I clean Crocs?',
      answer: 'Rinse with cold water and mild soap, then scrub with a soft brush. Avoid hot water and machine washing — heat can warp the shape. For tough stains, a Magic Eraser works well on Classic Crocs. Air dry at room temperature.',
    },
    {
      question: 'Are Crocs durable?',
      answer: 'With normal use, Crocs last 3–5 years. Croslite does not deteriorate with water exposure. However, prolonged UV exposure and heat can cause fading and slight shrinking over time. Store away from direct sunlight when not in use.',
    },
  ],
};

async function seed() {
  await connectDB();
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  console.log(`Found ${products.length} products`);

  let seeded = 0;
  let skipped = 0;
  let noTemplate = 0;

  for (const p of products) {
    if (p.faqs && p.faqs.length > 0) {
      skipped++;
      continue;
    }

    const brandKey = Object.keys(BRAND_FAQS).find(
      (k) => k.toLowerCase() === p.brand.toLowerCase()
    );
    const faqs = brandKey ? BRAND_FAQS[brandKey] : undefined;
    if (!faqs) {
      console.warn(`No FAQ template for brand: "${p.brand}" (product: ${p.slug})`);
      noTemplate++;
      continue;
    }

    await Product.findByIdAndUpdate(p._id, { $set: { faqs } });
    console.log(`✓  ${p.brand} — ${p.name}`);
    seeded++;
  }

  console.log(`\nDone. Seeded: ${seeded} | Skipped (already had FAQs): ${skipped} | No template: ${noTemplate}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
