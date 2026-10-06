import mongoose, { Schema, Document } from 'mongoose';
import { ListingAvailability } from './SellerListing';
import { IShipment, ShipmentSchema } from './Shipment';

export type SellerOrderStatus = 'pending_payment' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type PayoutStatus = 'pending' | 'due' | 'paid';

export const PAYOUT_DELAY_DAYS = 7;
export const LATE_PENALTY_TEXT = process.env.SELLER_LATE_PENALTY_TEXT
  || 'Orders not shipped (tracking added) within this timeline attract a late-fulfilment penalty, deducted from the payout as per the SNKRS CART seller terms.';

export const VERIFICATION_ANGLES = [
  { id: 'side-lateral', label: 'Lateral side', required: true },
  { id: 'side-medial', label: 'Medial side', required: true },
  { id: 'top-down', label: 'Top down', required: true },
  { id: 'heel', label: 'Heel', required: true },
  { id: 'sole', label: 'Sole', required: true },
  { id: 'size-tag', label: 'Size tag', required: true },
  { id: 'tongue', label: 'Tongue label', required: false },
  { id: 'box-label', label: 'Box label', required: false },
] as const;

export interface ISellerOrderItem {
  productId: string;
  listingId: mongoose.Types.ObjectId;
  name: string;
  brand: string;
  size: string;
  colorway: string;
  image: string;
  slug: string;
  qty: number;
  sellerPrice: number;
  listPrice: number;
  availability: ListingAvailability;
}

export interface IVerificationPhoto {
  angle: string;
  url: string;
}

export interface ISellerOrder extends Document {
  order: mongoose.Types.ObjectId;
  orderNumber: string;
  seller: mongoose.Types.ObjectId;
  items: ISellerOrderItem[];
  sellerTotal: number;
  status: SellerOrderStatus;
  verification: {
    status: VerificationStatus;
    photos: IVerificationPhoto[];
    submittedAt: Date | null;
    reviewedAt: Date | null;
    adminNote: string;
    attempts: number;
  };
  trackingNumber: string;
  deliveryService: string;
  trackingAddedAt: Date | null;
  trackingLockedAt: Date | null;
  deliveryCity: string;
  deliveryState: string;
  cancelReason: string;
  stockRestored: boolean;
  confirmedAt: Date | null;
  shipBy: Date | null;
  deliveredAt: Date | null;
  shipment: IShipment | null;
  payout: {
    status: PayoutStatus;
    amount: number;
    dueAt: Date | null;
    paidAt: Date | null;
    screenshotUrl: string;
    reference: string;
    note: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SellerOrderItemSchema = new Schema<ISellerOrderItem>(
  {
    productId: { type: String, required: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'SellerListing', required: true },
    name: { type: String, required: true },
    brand: { type: String, default: '' },
    size: { type: String, required: true },
    colorway: { type: String, default: '' },
    image: { type: String, default: '' },
    slug: { type: String, default: '' },
    qty: { type: Number, required: true, min: 1 },
    sellerPrice: { type: Number, required: true },
    listPrice: { type: Number, required: true },
    availability: { type: String, enum: ['instant', 'inhand', 'eta'], required: true },
  },
  { _id: false }
);

const SellerOrderSchema = new Schema<ISellerOrder>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    items: { type: [SellerOrderItemSchema], required: true },
    sellerTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending_payment',
      index: true,
    },
    verification: {
      status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
      photos: { type: [{ angle: String, url: String }], default: [] },
      submittedAt: { type: Date, default: null },
      reviewedAt: { type: Date, default: null },
      adminNote: { type: String, default: '' },
      attempts: { type: Number, default: 0 },
    },
    trackingNumber: { type: String, default: '' },
    deliveryService: { type: String, default: '' },
    trackingAddedAt: { type: Date, default: null },
    trackingLockedAt: { type: Date, default: null },
    deliveryCity: { type: String, default: '' },
    deliveryState: { type: String, default: '' },
    cancelReason: { type: String, default: '' },
    stockRestored: { type: Boolean, default: false },
    confirmedAt: { type: Date, default: null },
    shipBy: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    shipment: { type: ShipmentSchema, default: null },
    payout: {
      status: { type: String, enum: ['pending', 'due', 'paid'], default: 'pending' },
      amount: { type: Number, default: 0 },
      dueAt: { type: Date, default: null },
      paidAt: { type: Date, default: null },
      screenshotUrl: { type: String, default: '' },
      reference: { type: String, default: '' },
      note: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

SellerOrderSchema.index({ seller: 1, createdAt: -1 });
SellerOrderSchema.index({ 'verification.status': 1, status: 1 });
SellerOrderSchema.index({ 'payout.status': 1, 'payout.dueAt': 1 });

export const SellerOrder = mongoose.model<ISellerOrder>('SellerOrder', SellerOrderSchema);
