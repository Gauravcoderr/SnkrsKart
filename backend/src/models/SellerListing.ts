import mongoose, { Schema, Document } from 'mongoose';

export type ListingAvailability = 'instant' | 'inhand' | 'eta';
export type ListingStatus = 'active' | 'paused' | 'sold_out';

export const AVAILABILITY_ORDER: Record<ListingAvailability, number> = { instant: 0, inhand: 1, eta: 2 };
export const AVAILABILITY_SHIP_DAYS: Record<ListingAvailability, number> = { instant: 1, inhand: 3, eta: 20 };
export const AVAILABILITY_LABEL: Record<ListingAvailability, string> = {
  instant: 'Instant (ships within 24 hours)',
  inhand: 'In hand (ships in 3 days)',
  eta: 'Pre-order (ships in ~20 days)',
};

export const SELLER_COMMISSION_PCT = 10;

export function computeListPrice(sellerPrice: number): number {
  return Math.ceil((Math.round(sellerPrice) * (100 + SELLER_COMMISSION_PCT)) / 1000) * 10;
}

export function maxSellerPriceToBeat(publicPrice: number): number {
  let sp = Math.floor(((publicPrice - 10) * 100) / (100 + SELLER_COMMISSION_PCT));
  while (sp > 0 && computeListPrice(sp) >= publicPrice) sp -= 1;
  return Math.max(0, sp);
}

export function isAvailability(v: unknown): v is ListingAvailability {
  return v === 'instant' || v === 'inhand' || v === 'eta';
}

export interface ISellerListing extends Document {
  seller: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  size: number | string;
  sellerPrice: number;
  listPrice: number;
  availability: ListingAvailability;
  qty: number;
  status: ListingStatus;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SellerListingSchema = new Schema<ISellerListing>(
  {
    seller: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    size: { type: Schema.Types.Mixed, required: true },
    sellerPrice: { type: Number, required: true, min: 1 },
    listPrice: { type: Number, required: true, min: 1 },
    availability: { type: String, enum: ['instant', 'inhand', 'eta'], required: true },
    qty: { type: Number, required: true, min: 0, default: 1 },
    status: { type: String, enum: ['active', 'paused', 'sold_out'], default: 'active', index: true },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SellerListingSchema.index({ seller: 1, product: 1, size: 1 }, { unique: true });
SellerListingSchema.index({ product: 1, status: 1, qty: 1 });

export const SellerListing = mongoose.model<ISellerListing>('SellerListing', SellerListingSchema);
