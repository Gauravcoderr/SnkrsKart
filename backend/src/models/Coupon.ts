import mongoose, { Schema, Document } from 'mongoose';

export type DiscountType = 'percentage' | 'flat';
export type CouponCategory = 'all' | 'shoes' | 'clothing' | 'accessories';

export interface ICoupon extends Document {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  appliesTo: CouponCategory;
  active: boolean;
  expiresAt: Date | null;
  usedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code:              { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType:      { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue:     { type: Number, required: true, min: 0 },
    minOrderValue:     { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, default: null },
    appliesTo:         { type: String, enum: ['all', 'shoes', 'clothing', 'accessories'], default: 'all' },
    active:            { type: Boolean, default: true, index: true },
    expiresAt:         { type: Date, default: null },
    usedBy:            [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
