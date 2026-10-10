import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchDrops, fetchDropBySlug, fetchProductBySlug, NotFoundError } from '@/lib/api';
import { fetchAllProducts } from '@/lib/catalog';
import { matchSameProduct } from '@/lib/productMatch';
import { fullProductName } from '@/lib/productTitle';
import { cloudinaryOgImage, formatDropPrice, formatPrice } from '@/lib/utils';
import { dateKey, daysUntil, formatDropDate } from '@/lib/calendar';
import { AVAILABILITY_META } from '@/lib/availability';
import type { Drop, Offer, Product } from '@/types';
import Countdown from '@/components/drops/Countdown';
import AddToCalendar from '@/components/drops/AddToCalendar';
import DropGallery from '@/components/drops/DropGallery';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  try {
    const drop = await fetchDropBySlug(params.slug);
    const url = `${SITE_URL}/drops/${params.slug}`;
    const releaseDate = formatDropDate(drop.releaseDate, { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      title: { absolute: `${drop.name} Release Date India | ${releaseDate} | Snkrs Cart` },
      description: `${drop.name} releases in India on ${releaseDate}${drop.retailPrice ? ` for ${formatDropPrice(drop.retailPrice, drop.currency)}` : ''}. ${drop.description || `Official ${drop.brand} drop — ${drop.where || 'check official channels'}.`}`,
      alternates: { canonical: url },
      openGraph: {
        title: `${drop.name} | Release ${releaseDate}`,
        description: `${drop.brand} drop releasing ${releaseDate}${drop.retailPrice ? ` — ${formatDropPrice(drop.retailPrice, drop.currency)}` : ''}.`,
        url,
        siteName: 'Snkrs Cart',
        type: 'website',
        ...(drop.image ? { images: [{ url: cloudinaryOgImage(drop.image), width: 1200, height: 630, alt: drop.name }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${drop.name} | Release ${releaseDate}`,
        description: `${drop.brand} drop releasing ${releaseDate}${drop.retailPrice ? ` — ${formatDropPrice(drop.retailPrice, drop.currency)}` : ''}.`,
        ...(drop.image ? { images: [cloudinaryOgImage(drop.image)] } : {}),
      },
    };
  } catch {
    return { title: { absolute: 'Drop | Snkrs Cart' } };
  }
}

// Render on demand with ISR instead of prerendering every slug at build time. The build
// used to fire hundreds of requests at the Render free tier; one 502 either failed the deploy
// or, before today, baked a permanent 404 for a live page. First visit renders and caches.
export async function generateStaticParams() {
  return [];
}

export const revalidate = 300;

function formatDate(dateStr: string) {
  return formatDropDate(dateStr, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatLaunchTime(hhmm?: string): string | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm ?? '');
  if (!m) return null;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'} IST`;
}

function sortOffers(offers: Offer[]): Offer[] {
  return [...offers].sort((a, b) => {
    const na = Number(a.size);
    const nb = Number(b.size);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return String(a.size).localeCompare(String(b.size));
  });
}

function buildFaqs(drop: Drop, opts: { released: boolean; launchTime: string | null; stocked: boolean; comingSoon: boolean; fromPrice: number | null }): { q: string; a: string }[] {
  const { released, launchTime, stocked, comingSoon, fromPrice } = opts;
  const when = `${formatDate(drop.releaseDate)}${launchTime ? ` at ${launchTime}` : ''}`;
  const faqs: { q: string; a: string }[] = [
    {
      q: `When does the ${drop.name} release in India?`,
      a: released ? `The ${drop.name} released on ${when}.` : `The ${drop.name} releases on ${when}.`,
    },
  ];
  if (drop.retailPrice) {
    faqs.push({
      q: `What is the retail price of the ${drop.name}?`,
      a: drop.currency === 'USD'
        ? `The announced retail price is ${formatDropPrice(drop.retailPrice, drop.currency)} in US dollars.`
        : `The retail price is ${formatDropPrice(drop.retailPrice, drop.currency)}.`,
    });
  }
  if (drop.where) {
    faqs.push({
      q: `Where can I buy the ${drop.name}?`,
      a: `It ${released ? 'released' : 'releases'} through ${drop.where}.${stocked ? ' You can also buy it on SNKRS CART.' : ''}`,
    });
  }
  if (drop.styleCode) {
    faqs.push({
      q: `What is the style code of the ${drop.name}?`,
      a: `The style code is ${drop.styleCode}. Match it with the code on the box label to make sure you have the right pair.`,
    });
  }
  faqs.push({
    q: `Does SNKRS CART sell the ${drop.name}?`,
    a: stocked
      ? fromPrice
        ? `Yes. It is listed on SNKRS CART with prices by size, starting at ${formatPrice(fromPrice)}.`
        : 'Yes. It is listed on SNKRS CART. Open the product page to see which sizes are in stock.'
      : comingSoon
        ? 'It is coming soon to SNKRS CART. Sizes and prices go live on the product page once stock lands.'
        : 'Not at the moment. SNKRS CART does not stock this pair yet.',
  });
  if (faqs.length < 5 && drop.colorway) {
    faqs.splice(faqs.length - 1, 0, {
      q: `What colorway is the ${drop.name}?`,
      a: `The official colorway is ${drop.colorway}.`,
    });
  }
  return faqs.slice(0, 5);
}

// Retailer-specific "how to buy" steps, derived from the free-text `where` field
function copSteps(where: string): { title: string; steps: string[] } {
  const w = where.toLowerCase();
  if (w.includes('snkrs') || w.includes('nike') || w.includes('jordan')) {
    return {
      title: 'How to buy on Nike SNKRS',
      steps: [
        'Download the Nike SNKRS app and sign in with your Nike Member account.',
        'Save your shipping address and payment method in advance so checkout is one tap.',
        'The launch time appears in the app the day before. Set a notification on the product.',
        'At launch, enter the draw or tap Buy the moment it goes live. Check nike.com/in as a backup.',
      ],
    };
  }
  if (w.includes('adidas') || w.includes('confirmed')) {
    return {
      title: 'How to buy on adidas.co.in',
      steps: [
        'Create or sign in to your adidas India account before release day.',
        'Save shipping and payment details so you can check out fast.',
        'Refresh the product page at launch, select your size and check out immediately.',
        'Follow adidas India on Instagram for raffle or in-store announcements.',
      ],
    };
  }
  if (w.includes('new balance')) {
    return {
      title: 'How to buy New Balance in India',
      steps: [
        'Sign in to newbalance.co.in and save your details ahead of time.',
        'Limited pairs also release at partner boutiques. Check their Instagram for raffles.',
        'Be online a few minutes before launch and check out as soon as your size appears.',
      ],
    };
  }
  return {
    title: 'How to buy this release',
    steps: [
      `Follow ${where || 'the retailer'} for the exact launch time and any raffle details.`,
      'Create an account and save payment and shipping details in advance.',
      'Be online a few minutes before launch and check out fast. Sizes go quickly.',
    ],
  };
}

export default async function DropPage(props: Props) {
  const params = await props.params;
  let drop;
  try { drop = await fetchDropBySlug(params.slug); }
  catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }

  const url = `${SITE_URL}/drops/${params.slug}`;
  const days = daysUntil(drop.releaseDate);
  const released = days < 0;
  const gallery = Array.from(new Set([drop.image, ...(drop.images ?? [])].filter(Boolean)));

  // Related: other upcoming drops, same brand first
  let related: Awaited<ReturnType<typeof fetchDrops>> = [];
  try {
    const all = (await fetchDrops()).filter((d) => d.slug !== drop.slug && daysUntil(d.releaseDate) >= 0);
    const same = all.filter((d) => d.brand === drop.brand);
    const other = all.filter((d) => d.brand !== drop.brand);
    related = [...same, ...other].slice(0, 4);
  } catch { /* skip */ }

  let product: Product | null = null;
  let productSlug = drop.productSlug || '';
  if (!productSlug) {
    const catalog = await fetchAllProducts({ revalidate: 3600 }).catch(() => []);
    productSlug = matchSameProduct({ brand: drop.brand, name: drop.name, colorway: drop.colorway, styleCode: drop.styleCode }, catalog)?.slug ?? '';
  }
  if (productSlug) {
    try { product = await fetchProductBySlug(productSlug); } catch { product = null; }
  }
  const comingSoon = !!product?.comingSoon;
  const offers = product && !comingSoon
    ? sortOffers((product.offers ?? []).filter((o) => o.price > 0 && o.maxQty > 0))
    : [];
  const fromPrice = offers.length > 0 ? Math.min(...offers.map((o) => o.price)) : null;
  const launchTime = formatLaunchTime(drop.launchTimeIST);
  const productHref = product ? `/products/${product.slug}` : null;
  const stocked = offers.length > 0;
  const storeHref = productHref && (drop.availableAtStore || stocked) ? productHref : null;
  const faqs = buildFaqs(drop, { released, launchTime, stocked, comingSoon, fromPrice });

  const howTo = storeHref ? null : copSteps(drop.where);

  const urgency = !released && days === 0 ? 'today'
    : !released && days === 1 ? 'tomorrow'
    : !released && days <= 7 ? 'soon'
    : released ? 'released'
    : 'upcoming';

  const urgencyConfig = {
    today:    { bar: 'bg-red-500',   text: 'text-red-600',   label: 'Dropping Today' },
    tomorrow: { bar: 'bg-orange-500', text: 'text-orange-600', label: 'Dropping Tomorrow' },
    soon:     { bar: 'bg-amber-400', text: 'text-amber-700', label: `${days} days to drop` },
    upcoming: { bar: 'bg-zinc-200',  text: 'text-zinc-600',  label: `Releasing in ${days} days` },
    released: { bar: 'bg-zinc-100',  text: 'text-zinc-500',  label: `Released — ${formatDate(drop.releaseDate)}` },
  }[urgency];

  // ISO date-only string (YYYY-MM-DD) — required format for Google Event rich results
  const isoDate = dateKey(drop.releaseDate);

  const locationUrl = drop.where?.toLowerCase()?.includes('snkrs') || drop.where?.toLowerCase()?.includes('jordan')
    ? 'https://www.nike.com/launch'
    : drop.where?.toLowerCase()?.includes('adidas') ? 'https://www.adidas.co.in'
    : url;

  const eventJson = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: drop.name,
    startDate: isoDate,
    endDate: isoDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: locationUrl,
    },
    description: drop.description || `${drop.name} — official ${drop.brand} release`,
    url,
    image: gallery.length > 1 ? gallery : gallery[0],
    organizer: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL },
    offers: drop.retailPrice ? {
      '@type': 'Offer',
      price: drop.retailPrice,
      priceCurrency: drop.currency,
      availability: released ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      validFrom: isoDate,
      url: storeHref ? `${SITE_URL}${storeHref}` : locationUrl,
      seller: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL },
    } : undefined,
  };

  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Drop Calendar', item: `${SITE_URL}/drops` },
      { '@type': 'ListItem', position: 3, name: drop.name, item: url },
    ],
  };

  const faqJson = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const specs = [
    ['Brand', drop.brand],
    ['Release Date', `${formatDate(drop.releaseDate)}${launchTime ? `, ${launchTime}` : ''}`],
    ['Retail Price', drop.retailPrice ? formatDropPrice(drop.retailPrice, drop.currency) : 'TBC'],
    ['Colorway', drop.colorway || null],
    ['Style Code', drop.styleCode || null],
    ['Where to Buy', drop.where || null],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJson) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }} />
      {faqs.length >= 3 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }} />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-[10px] text-zinc-400 mb-8 flex items-center gap-1.5">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/drops" className="hover:text-zinc-900 transition-colors">Drop Calendar</Link>
          <span>/</span>
          <span className="text-zinc-900 font-semibold truncate max-w-[200px]">{drop.name}</span>
        </nav>

        {/* Urgency bar */}
        <div className={`h-1 w-full mb-8 rounded-full ${urgencyConfig.bar}`} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          {/* ── Image ── */}
          <DropGallery
            images={gallery}
            name={drop.name}
            brand={drop.brand}
            overlay={(
              <>
                {!released && (
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <div className={`px-3 py-1.5 rounded-sm font-black text-[11px] tracking-widest uppercase shadow-lg ${
                      urgency === 'today' ? 'bg-red-500 text-white' :
                      urgency === 'tomorrow' ? 'bg-orange-500 text-white' :
                      urgency === 'soon' ? 'bg-amber-400 text-zinc-900' :
                      'bg-zinc-900/80 backdrop-blur text-white'
                    }`}>
                      {urgency === 'today' ? 'TODAY' : urgency === 'tomorrow' ? 'TOMORROW' : `${days}D`}
                    </div>
                  </div>
                )}
                {drop.availableAtStore && (
                  <div className="absolute top-3 left-3 bg-zinc-900 text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-sm pointer-events-none">
                    In Store
                  </div>
                )}
              </>
            )}
          />

          {/* ── Details ── */}
          <div className="flex flex-col">
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 mb-1">{drop.brand}</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 mb-1 leading-tight">{drop.name}</h1>
            {drop.colorway && <p className="text-sm text-zinc-400 mb-5">{drop.colorway}</p>}

            {/* Status pill + live countdown */}
            <div className="inline-flex items-center gap-2 mb-3">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${urgencyConfig.bar}`} />
              <p className={`text-xs font-bold ${urgencyConfig.text}`}>{urgencyConfig.label}</p>
            </div>
            {!released && (
              <div className="mb-6 text-zinc-900">
                <Countdown releaseDate={drop.releaseDate} launchTimeIST={drop.launchTimeIST} size="lg" />
              </div>
            )}

            {/* Price + Date prominent */}
            {drop.retailPrice && (
              <div className="mb-5 p-4 bg-zinc-950 text-white flex items-center justify-between rounded-sm">
                <div>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Retail Price</p>
                  <p className="text-2xl font-black">{formatDropPrice(drop.retailPrice, drop.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Release</p>
                  <p className="text-sm font-bold text-zinc-200">{formatDropDate(drop.releaseDate, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {launchTime && <p className="text-[11px] font-semibold text-zinc-400 mt-0.5">{launchTime}</p>}
                </div>
              </div>
            )}

            {/* Specs table */}
            <div className="grid grid-cols-1 gap-2 mb-5">
              {specs.map(([label, value]) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-zinc-100 last:border-0">
                  <p className="text-[9px] font-black tracking-widest uppercase text-zinc-400 w-24 shrink-0 mt-0.5">{label}</p>
                  <p className="text-sm font-semibold text-zinc-800 leading-snug">{value}</p>
                </div>
              ))}
            </div>

            {drop.description && (
              <p className="text-sm text-zinc-500 leading-relaxed mb-5 flex-1">{drop.description}</p>
            )}

            {/* CTA */}
            <div className="space-y-3">
              {storeHref ? (
                <Link
                  href={storeHref}
                  className="block w-full py-4 bg-zinc-900 text-white text-sm font-black tracking-widest uppercase text-center hover:bg-zinc-700 transition-colors rounded-sm"
                >
                  Shop Now at SNKRS CART
                </Link>
              ) : (
                <div className="border border-zinc-100 rounded-sm p-4 text-center bg-zinc-50">
                  <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mb-1">Where to Buy</p>
                  <p className="text-sm font-bold text-zinc-700">{drop.where || 'Official brand site'}</p>
                </div>
              )}
              {!released && <AddToCalendar drop={drop} variant="button" />}
            </div>
          </div>
        </div>

        {product && productHref && offers.length > 0 && (() => {
          const lowest = Math.min(...offers.map((o) => o.price));
          const markLowest = offers.length > 1 && offers.filter((o) => o.price === lowest).length === 1;
          const productName = fullProductName(product.brand, product.name);
          return (
            <section className="mb-10 border border-zinc-200 rounded-sm overflow-hidden bg-white" aria-labelledby="buy-on-snkrs-cart">
              <div className="flex flex-col sm:flex-row">
                <Link href={productHref} className="group relative block sm:w-60 shrink-0 bg-zinc-50 aspect-[4/3] sm:aspect-auto sm:min-h-[240px]">
                  {product.images?.[0] && (
                    <Image
                      src={product.images[0]}
                      alt={productName}
                      fill
                      sizes="(max-width: 640px) 100vw, 240px"
                      className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur text-[9px] font-black tracking-widest uppercase text-zinc-900 px-2 py-1 rounded-sm border border-zinc-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    In stock
                  </span>
                </Link>

                <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col gap-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 mb-1">Buy it on SNKRS CART</p>
                      <h2 id="buy-on-snkrs-cart" className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 leading-tight">
                        <Link href={productHref} className="hover:underline underline-offset-4">{productName}</Link>
                      </h2>
                      {product.colorway && <p className="text-xs text-zinc-400 mt-1">{product.colorway}</p>}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 mb-0.5">From</p>
                      <p className="text-2xl font-black text-zinc-900 leading-none">{formatPrice(lowest)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-2.5">
                      Price by size · {offers.length} {offers.length === 1 ? 'size' : 'sizes'} available
                    </p>
                    <ul className="grid grid-cols-2 min-[420px]:grid-cols-3 lg:grid-cols-4 gap-2">
                      {offers.map((o) => {
                        const meta = AVAILABILITY_META[o.availability];
                        const isLowest = markLowest && o.price === lowest;
                        return (
                          <li key={String(o.size)}>
                            <Link
                              href={productHref}
                              className={`relative flex flex-col gap-0.5 h-full rounded-sm border px-3 py-2.5 transition-colors hover:border-zinc-900 hover:bg-zinc-50 ${isLowest ? 'border-zinc-900' : 'border-zinc-200'}`}
                            >
                              {isLowest && (
                                <span className="absolute -top-2 right-2 bg-zinc-900 text-white text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-sm">Lowest</span>
                              )}
                              <span className="text-sm font-black text-zinc-900">{typeof o.size === 'number' ? `UK ${o.size}` : o.size}</span>
                              <span className="text-sm font-bold text-zinc-700 tabular-nums">{formatPrice(o.price)}</span>
                              <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                                {meta.label} · {meta.short}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-4 border-t border-zinc-100">
                    <Link
                      href={productHref}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white text-xs font-black tracking-widest uppercase rounded-sm hover:bg-zinc-700 transition-colors"
                    >
                      Choose your size
                      <span aria-hidden="true">→</span>
                    </Link>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                      <li className="inline-flex items-center gap-1.5"><span className="text-emerald-600" aria-hidden="true">✓</span>Checked for authenticity</li>
                      <li className="inline-flex items-center gap-1.5"><span className="text-emerald-600" aria-hidden="true">✓</span>Free shipping across India</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* How to cop */}
        {howTo && !released && (
          <section className="mb-10 border border-zinc-100 rounded-sm p-5 sm:p-6 bg-zinc-50/60">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Game plan</p>
            <h2 className="text-lg font-black tracking-tight text-zinc-900 mb-4">{howTo.title}</h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {howTo.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-600 leading-relaxed">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-900 text-white text-[10px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {faqs.length >= 3 && (
          <section className="mb-10">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">FAQ</p>
            <h2 className="text-lg font-black tracking-tight text-zinc-900 mb-3">{drop.name}: release questions</h2>
            <div className="divide-y divide-zinc-100 border-y border-zinc-100">
              {faqs.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex items-start justify-between gap-4 cursor-pointer list-none text-sm font-bold text-zinc-900 [&::-webkit-details-marker]:hidden">
                    <span>{f.q}</span>
                    <span className="shrink-0 mt-0.5 text-zinc-400 group-open:rotate-45 transition-transform duration-200" aria-hidden>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-zinc-500 leading-relaxed pr-8">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related drops */}
        {related.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black tracking-[0.3em] uppercase text-zinc-900">More upcoming drops</h2>
              <Link href="/drops" className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-zinc-900 transition-colors">Full calendar →</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map((r) => {
                const rd = daysUntil(r.releaseDate);
                return (
                  <Link key={r._id} href={`/drops/${r.slug}`} className="group border border-zinc-100 hover:border-zinc-300 hover:shadow-md transition-all overflow-hidden bg-white">
                    <div className="relative aspect-[4/3] bg-zinc-50 overflow-hidden">
                      {r.image && <Image src={r.image} alt={r.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 1024px) 50vw, 25vw" />}
                      <span className={`absolute top-2 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-sm ${rd === 0 ? 'bg-red-500 text-white' : rd === 1 ? 'bg-orange-500 text-white' : rd <= 7 ? 'bg-amber-400 text-zinc-900' : 'bg-zinc-900/70 text-white'}`}>
                        {rd === 0 ? 'Today' : rd === 1 ? 'Tomorrow' : `${rd}D`}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-400 mb-0.5">{r.brand}</p>
                      <p className="text-xs font-bold text-zinc-900 leading-snug line-clamp-2 group-hover:text-zinc-600 transition-colors">{r.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">{formatDropDate(r.releaseDate, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer nav */}
        <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
          <Link href="/drops" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors font-semibold">
            ← Drop Calendar
          </Link>
          <Link href="/products" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors font-semibold">
            Shop All Sneakers →
          </Link>
        </div>
      </div>
    </>
  );
}
