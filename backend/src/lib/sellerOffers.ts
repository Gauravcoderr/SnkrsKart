import { SellerListing, ListingAvailability, AVAILABILITY_ORDER } from '../models/SellerListing';
import { Seller } from '../models/Seller';
import mongoose from 'mongoose';

export interface Offer {
  size: number | string;
  price: number;
  originalPrice: number | null;
  availability: ListingAvailability;
  source: 'store' | 'seller';
  listingId?: string;
  maxQty: number;
}

type ProductLike = {
  _id: unknown;
  price: number;
  originalPrice?: number | null;
  productType?: string;
  sizes?: number[];
  availableSizes?: number[];
  stringSizes?: string[];
  availableStringSizes?: string[];
  variants?: Array<{ size: number | string; price: number; originalPrice: number | null; maxQty: number }>;
  soldOut?: boolean;
  comingSoon?: boolean;
};

const STORE_AVAILABILITY: ListingAvailability = 'inhand';

function sizeKey(size: number | string): string {
  return String(size);
}

function better(a: Offer, b: Offer): Offer {
  if (a.price !== b.price) return a.price < b.price ? a : b;
  if (AVAILABILITY_ORDER[a.availability] !== AVAILABILITY_ORDER[b.availability]) {
    return AVAILABILITY_ORDER[a.availability] < AVAILABILITY_ORDER[b.availability] ? a : b;
  }
  return a.source === 'store' ? a : b;
}

function storeOffers(product: ProductLike): Offer[] {
  const isStringMode = product.productType && product.productType !== 'shoes' && (product.stringSizes?.length ?? 0) > 0;
  const available: Array<number | string> = isStringMode
    ? (product.availableStringSizes ?? [])
    : (product.availableSizes ?? []);
  if (product.soldOut) return [];
  return available.map((size) => {
    const variant = product.variants?.find((v) => sizeKey(v.size) === sizeKey(size));
    return {
      size,
      price: variant?.price ?? product.price,
      originalPrice: variant?.originalPrice ?? product.originalPrice ?? null,
      availability: STORE_AVAILABILITY,
      source: 'store' as const,
      maxQty: variant?.maxQty ?? 5,
    };
  });
}

function sortSizes(sizes: Array<number | string>, productOrder: Array<number | string> = []): Array<number | string> {
  const rank = new Map(productOrder.map((s, i) => [sizeKey(s), i]));
  return [...sizes].sort((a, b) => {
    const ra = rank.get(sizeKey(a)); const rb = rank.get(sizeKey(b));
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    const na = Number(a); const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });
}

function definedSizes(product: ProductLike): Array<number | string> {
  const isStringMode = product.productType && product.productType !== 'shoes' && (product.stringSizes?.length ?? 0) > 0;
  return isStringMode ? (product.stringSizes ?? []) : (product.sizes ?? []);
}

export async function loadActiveListings(productIds: unknown[]) {
  if (productIds.length === 0) return [];
  const listings = await SellerListing.find({
    product: { $in: productIds as mongoose.Types.ObjectId[] },
    status: 'active',
    qty: { $gt: 0 },
  }).lean();
  if (listings.length === 0) return [];
  const sellerIds = [...new Set(listings.map((l) => String(l.seller)))];
  const activeSellers = await Seller.find({ _id: { $in: sellerIds }, status: 'active' }).select('_id').lean();
  const activeSet = new Set(activeSellers.map((s) => String(s._id)));
  return listings.filter((l) => activeSet.has(String(l.seller)));
}

export function buildOffers(product: ProductLike, listings: Array<{ _id: unknown; size: number | string; listPrice: number; availability: ListingAvailability; qty: number }>): Offer[] {
  const bySize = new Map<string, Offer>();
  for (const offer of storeOffers(product)) bySize.set(sizeKey(offer.size), offer);
  for (const l of listings) {
    const offer: Offer = {
      size: l.size,
      price: l.listPrice,
      originalPrice: product.originalPrice && product.originalPrice > l.listPrice ? product.originalPrice : null,
      availability: l.availability,
      source: 'seller',
      listingId: String(l._id),
      maxQty: l.qty,
    };
    const key = sizeKey(l.size);
    const existing = bySize.get(key);
    bySize.set(key, existing ? better(existing, offer) : offer);
  }
  const offers = [...bySize.values()];
  const order = sortSizes(offers.map((o) => o.size), definedSizes(product)).map(sizeKey);
  return offers.sort((a, b) => order.indexOf(sizeKey(a.size)) - order.indexOf(sizeKey(b.size)));
}

export function applyOffers<T extends ProductLike>(product: T, listings: Parameters<typeof buildOffers>[1]): T & { offers: Offer[] } {
  const offers = buildOffers(product, listings);
  const hasSellerOffer = offers.some((o) => o.source === 'seller');
  if (!hasSellerOffer) return { ...product, offers };

  const isStringMode = product.productType && product.productType !== 'shoes' && (product.stringSizes?.length ?? 0) > 0;
  const offerSizes = offers.map((o) => o.size);
  const patched: T & { offers: Offer[] } = { ...product, offers };

  if (isStringMode) {
    const defined = product.stringSizes ?? [];
    patched.stringSizes = sortSizes([...new Set([...defined, ...offerSizes.map(String)])], defined) as string[];
    patched.availableStringSizes = sortSizes(offerSizes.map(String), defined) as string[];
  } else {
    const numeric = offerSizes.map(Number).filter((n) => !isNaN(n));
    patched.sizes = sortSizes([...new Set([...(product.sizes ?? []), ...numeric])]) as number[];
    patched.availableSizes = sortSizes(numeric) as number[];
  }
  patched.variants = offers.map((o) => ({ size: o.size, price: o.price, originalPrice: o.originalPrice, maxQty: o.maxQty }));
  patched.price = Math.min(...offers.map((o) => o.price));
  patched.soldOut = false;
  return patched;
}

export async function attachSellerOffers<T extends ProductLike>(products: T[]): Promise<Array<T & { offers: Offer[] }>> {
  const eligible = products.filter((p) => !p.comingSoon);
  const listings = await loadActiveListings(eligible.map((p) => p._id));
  const byProduct = new Map<string, typeof listings>();
  for (const l of listings) {
    const key = String(l.product);
    if (!byProduct.has(key)) byProduct.set(key, []);
    byProduct.get(key)!.push(l);
  }
  return products.map((p) => applyOffers(p, byProduct.get(String(p._id)) ?? []));
}
