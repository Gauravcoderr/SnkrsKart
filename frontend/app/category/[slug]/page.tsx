import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';

interface CategoryConfig {
  label: string;
  metaTitle: string;
  metaDesc: string;
  guide: string;
  faqs: { q: string; a: string }[];
  filter: { category?: string; gender?: string; minPrice?: number };
}

const CATEGORIES: Record<string, CategoryConfig> = {
  running: {
    label: 'Running Shoes',
    metaTitle: 'Best Running Shoes in India | Buy Online | SNKRS CART',
    metaDesc: 'Shop authentic running shoes in India from Nike, Adidas, New Balance & more. Performance cushioning, breathable uppers, pan-India delivery.',
    guide: 'Running shoes in India need to balance cushioning, breathability, and durability across varied terrain — from city roads to gym tracks. Look for responsive midsoles, secure heel counters, and mesh uppers that handle India\'s heat. Whether you\'re logging kilometres on Bandra\'s promenade or hitting the treadmill, the right running shoe starts with the right fit.',
    faqs: [
      { q: 'What running shoes are best for Indian roads?', a: 'Cushioned road-running shoes with durable rubber outsoles work best on Indian tarmac. Nike Pegasus, Adidas Ultraboost, and New Balance Fresh Foam lines are popular choices.' },
      { q: 'How often should I replace running shoes?', a: 'Typically every 500–800 km. If the midsole feels flat or outsole tread is worn, it\'s time for a new pair.' },
      { q: 'Do running shoes work for the gym?', a: 'Running shoes have forward propulsion cushioning that can reduce stability during lateral gym movements. For cross-training, consider a dedicated training shoe.' },
    ],
    filter: { category: 'Running' },
  },
  basketball: {
    label: 'Basketball Shoes',
    metaTitle: 'Basketball Shoes India | Buy Air Jordan, Nike Basketball Online | SNKRS CART',
    metaDesc: 'Shop authentic basketball shoes in India — Air Jordan, Nike, Adidas. Ankle support, responsive cushioning, iconic silhouettes. Free pan-India shipping.',
    guide: 'Basketball shoes are engineered for explosive lateral cuts, vertical jumps, and hard court traction. Air Jordan, Nike KD, and Adidas Harden lines bring performance from the NBA courts to your local game. High-top silhouettes offer ankle support while low-cuts prioritise speed. Today many basketball shoes cross over into streetwear — the Jordan 4 and Jordan 1 are as popular off-court as on.',
    faqs: [
      { q: 'Are Jordan shoes basketball shoes?', a: 'The Jordan line was originally designed for NBA play. Modern retro Jordans like the Jordan 1 and Jordan 4 are now predominantly worn as lifestyle sneakers, though they retain court-ready construction.' },
      { q: 'High-top vs low-top basketball shoes — which is better?', a: 'High-tops provide more ankle support for post players and those prone to sprains. Guards and quick players often prefer low-tops for freedom of movement.' },
      { q: 'Can I wear basketball shoes casually?', a: 'Absolutely. Air Jordans, Nike Dunks, and Adidas Forum are among the most popular casual/lifestyle shoes globally.' },
    ],
    filter: { category: 'Basketball' },
  },
  lifestyle: {
    label: 'Lifestyle Sneakers',
    metaTitle: 'Lifestyle Sneakers India | Buy Nike, Adidas, New Balance Online | SNKRS CART',
    metaDesc: 'Shop lifestyle sneakers in India — Nike Air Force 1, Adidas Samba, New Balance 550 & more. Authentic pairs, free pan-India shipping.',
    guide: 'Lifestyle sneakers are built for all-day wear and style over sport. From the timeless Nike Air Force 1 — a basketball shoe that became the symbol of street culture — to the Adidas Samba that dominated European football pitches before owning city pavements, lifestyle sneakers carry decades of cultural weight. In India\'s sneaker scene, clean colourways and cult silhouettes rule the streets of Mumbai, Delhi, and Bengaluru.',
    faqs: [
      { q: 'What are lifestyle sneakers?', a: 'Lifestyle sneakers are shoes originally designed for sport that evolved into fashion staples. The Nike Air Force 1, Adidas Stan Smith, and New Balance 550 are classic examples.' },
      { q: 'How do lifestyle sneakers fit?', a: 'Most lifestyle sneakers fit true to size. Chunky silhouettes like New Balance often benefit from going half a size down.' },
      { q: 'Which lifestyle sneaker brands are most popular in India?', a: 'Nike, Jordan, Adidas, and New Balance dominate India\'s lifestyle sneaker market. Crocs has also grown significantly as a casual lifestyle option.' },
    ],
    filter: { category: 'Lifestyle' },
  },
  training: {
    label: 'Training Shoes',
    metaTitle: 'Training Shoes India | Buy Cross-Training Shoes Online | SNKRS CART',
    metaDesc: 'Shop training shoes in India for the gym, HIIT, and cross-training. Stable flat soles, lateral support, durable construction. Free pan-India shipping.',
    guide: 'Training shoes are the unsung heroes of the gym. Unlike running shoes with their forward-propulsion cushioning, trainers feature flat, stable soles ideal for squats, deadlifts, and lateral agility work. Nike Metcon and Adidas Dropset are favourites in Indian weightlifting and CrossFit communities. A good training shoe should lock your foot in place during heavy compound lifts while still allowing explosive movement.',
    faqs: [
      { q: 'Can I use running shoes for the gym?', a: 'Running shoes\' thick cushioning reduces stability during heavy lifts. A flat training shoe gives better ground contact for squats and deadlifts.' },
      { q: 'What are the best shoes for leg day?', a: 'Flat, stiff-soled trainers like the Nike Metcon or Adidas Dropset are ideal. Some lifters prefer dedicated weightlifting shoes with an elevated heel for squats.' },
      { q: 'Are training shoes good for daily walking?', a: 'They work but aren\'t as comfortable as running or lifestyle shoes for extended walking due to minimal cushioning.' },
    ],
    filter: { category: 'Training' },
  },
  men: {
    label: "Men's Sneakers",
    metaTitle: "Men's Sneakers India | Buy Men's Nike, Jordan, Adidas Online | SNKRS CART",
    metaDesc: "Shop men's sneakers in India — Nike, Jordan, Adidas, New Balance & Crocs. All sizes UK 6–12. Authentic, free pan-India shipping.",
    guide: "Men's sneakers in India span the full spectrum from performance running shoes to luxury collab drops. The staples that dominate Indian men's wardrobes: Nike Air Force 1 in white, Air Jordan 1 in Chicago colourways, Adidas Samba in OG black-and-white, and New Balance 550 in cream. Size runs are typically UK 6 to 12 — and SNKRS KART stocks authentic pairs with verified provenance.",
    faqs: [
      { q: 'What are the most popular men\'s sneakers in India?', a: 'Air Jordan 1, Nike Dunk Low, Adidas Samba, and New Balance 550 are consistently the top-selling men\'s sneakers in Indian cities.' },
      { q: 'How do I find my UK sneaker size?', a: 'If you wear Indian size 9, your UK size is approximately 8. Check our size guide at /size-guide for a full conversion chart.' },
      { q: 'Are men\'s and women\'s sneaker sizes the same?', a: 'No. Women\'s sizes run approximately 1.5 sizes smaller than men\'s in the same model. SNKRS KART lists sizes in UK men\'s equivalent.' },
    ],
    filter: { gender: 'men' },
  },
  women: {
    label: "Women's Sneakers",
    metaTitle: "Women's Sneakers India | Buy Women's Nike, Adidas Online | SNKRS CART",
    metaDesc: "Shop women's sneakers in India — Nike, Adidas, New Balance & Crocs. Authentic pairs, all sizes, free pan-India shipping.",
    guide: "Women's sneaker culture in India has surged over the past five years. From chunky New Balance 9060s to minimal Adidas Stan Smiths and the iconic Air Jordan 1 Low in exclusive women's colourways, Indian women's sneaker taste runs from clean minimalism to bold statement pieces. Sizes on SNKRS KART are listed in UK men's equivalents — women typically size down 1.5 from their usual Indian size.",
    faqs: [
      { q: 'Are women\'s sneakers different from men\'s?', a: 'Women\'s-exclusive releases often feature different colourways and smaller size runs (UK 3–8). Many women also buy men\'s sneakers in smaller sizes for a wider selection.' },
      { q: 'What are the most popular women\'s sneakers in India?', a: 'Nike Air Force 1, Adidas Samba, New Balance 9060, and Crocs Classic Clog rank among the most-worn women\'s sneakers across Indian cities.' },
      { q: 'Do Crocs qualify as sneakers?', a: 'Not technically, but they\'ve become a major part of casual footwear culture in India — we stock them because that\'s what our community wants.' },
    ],
    filter: { gender: 'women' },
  },
  kids: {
    label: "Kids' Sneakers",
    metaTitle: "Kids' Sneakers India | Buy Kids Nike, Jordan, Adidas Online | SNKRS CART",
    metaDesc: "Shop authentic kids' sneakers in India — Nike, Jordan, Adidas & New Balance. Durable, lightweight, free pan-India shipping.",
    guide: "Getting kids into authentic sneakers early builds an appreciation for quality and craftsmanship. Nike and Jordan make kid-specific versions of their most iconic silhouettes — lighter, more flexible, and built for active play. Adidas Superstar and Stan Smith remain perennial kids' favourites for school. Look for hook-and-loop closures for younger children and reinforced toe caps for durability.",
    faqs: [
      { q: 'How do I find the right size for kids\' sneakers?', a: 'Measure your child\'s foot length and add 1 cm for growing room. Our size guide at /size-guide has a full kids\' size conversion chart.' },
      { q: 'Are Jordan shoes available in kids\' sizes?', a: 'Yes — Jordan Brand releases GS (Grade School) and TD (Toddler) versions of most popular silhouettes including the Jordan 1, Jordan 4, and Jordan 11.' },
      { q: 'Are kids\' sneakers durable enough for school?', a: 'Nike and Adidas kids\' lines are built for active use. For school, look for rubber toe caps and reinforced outsoles.' },
    ],
    filter: { gender: 'kids' },
  },
  sale: {
    label: 'Sneakers on Sale',
    metaTitle: 'Sneakers on Sale India | Discounted Nike, Adidas, Jordan Online | SNKRS CART',
    metaDesc: 'Shop discounted sneakers in India — authentic Nike, Jordan, Adidas & New Balance on sale. Best prices, free pan-India shipping.',
    guide: "SNKRS KART's sale section features authentic discounted sneakers — same verified pairs, lower prices. Sale stock moves fast: colourways that didn't get a restock, end-of-season pairs, and sample-run sizes. Everything in this section is 100% authentic with the same quality assurance as full-price items. Grab your size before it's gone.",
    faqs: [
      { q: 'Are sale sneakers authentic?', a: 'Absolutely. Every pair on SNKRS KART — sale or full price — is 100% authentic. We source directly and verify every unit.' },
      { q: 'Why are some sneakers discounted?', a: 'Sale items may be end-of-season stock, older colourways, or pairs with limited size runs. Quality and authenticity are never compromised.' },
      { q: 'Can I return sale sneakers?', a: 'Yes — our standard return policy applies to sale items. See /returns for details.' },
    ],
    filter: { minPrice: 0 },
  },
};

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = CATEGORIES[params.slug];
  if (!config) return { title: 'SNKRS CART' };
  const url = `${SITE_URL}/category/${params.slug}`;
  return {
    title: config.metaTitle,
    description: config.metaDesc,
    alternates: { canonical: url },
    openGraph: { title: config.metaTitle, description: config.metaDesc, url, siteName: 'SNKRS CART', type: 'website' },
  };
}

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: Props) {
  const config = CATEGORIES[params.slug];
  if (!config) notFound();

  const filterArg: Record<string, string | number> = {};
  if (config.filter.category) filterArg.category = config.filter.category;
  if (config.filter.gender) filterArg.gender = config.filter.gender;
  if (params.slug === 'sale') filterArg.minPrice = 1;

  let products: Awaited<ReturnType<typeof fetchProducts>>['products'] = [];
  try {
    const res = await fetchProducts({ ...filterArg, limit: 48 } as Parameters<typeof fetchProducts>[0]);
    products = Array.isArray(res) ? res : res.products ?? [];
    if (params.slug === 'sale') {
      products = products.filter((p) => p.discount && p.discount > 0);
    }
  } catch { /* show empty state */ }

  const url = `${SITE_URL}/category/${params.slug}`;

  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'All Sneakers', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: config.label, item: url },
    ],
  };

  const faqJson = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const itemListJson = products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: config.label,
    url,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        url: `${SITE_URL}/products/${p.slug}`,
        image: p.images?.[0],
        offers: { '@type': 'Offer', price: p.price, priceCurrency: 'INR', availability: p.soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' },
      },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }} />
      {itemListJson && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJson) }} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-[10px] text-zinc-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-zinc-900 transition-colors">All Sneakers</Link>
          <span>/</span>
          <span className="text-zinc-900 font-semibold">{config.label}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 mb-3">{config.label}</h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-3xl">{config.guide}</p>
        </div>

        {/* Product grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-16">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-zinc-100 mb-16">
            <p className="text-sm font-semibold text-zinc-900 mb-1">No products in this category yet</p>
            <p className="text-xs text-zinc-400 mb-4">Check back soon or browse all sneakers.</p>
            <Link href="/products" className="inline-block bg-zinc-900 text-white px-6 py-2.5 text-xs font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors">
              Browse All
            </Link>
          </div>
        )}

        {/* FAQs */}
        <div className="border-t border-zinc-100 pt-10">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Common Questions</h2>
          <p className="text-xl font-bold tracking-tight text-zinc-900 mb-6">{config.label} FAQ</p>
          <div className="space-y-4 max-w-3xl">
            {config.faqs.map((faq) => (
              <div key={faq.q} className="p-5 bg-zinc-50 border border-zinc-100">
                <p className="text-sm font-bold text-zinc-900 mb-2">{faq.q}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
