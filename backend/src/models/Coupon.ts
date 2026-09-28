import mongoose, { Schema, Document } from 'mongoose';

export type DiscountType = 'percentage' | 'flat';
export type CouponCategory = 'all' | 'shoes' | 'clothing' | 'accessories';

export interface ICouponAssignment {
  user: mongoose.Types.ObjectId;
  maxUses: number;
  usedCount: number;
}

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
  restricted: boolean;
  assignedUsers: ICouponAssignment[];
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
    restricted:        { type: Boolean, default: false },
    assignedUsers: [
      {
        _id: false,
        user:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
        maxUses:   { type: Number, default: 1, min: 1 },
        usedCount: { type: Number, default: 0, min: 0 },
      },
    ],
  },
  { timestamps: true }
);

CouponSchema.index({ 'assignedUsers.user': 1 });

export function couponUserError(coupon: ICoupon, userId: string): string | null {
  const assignment = coupon.assignedUsers?.find((a) => String(a.user) === String(userId));
  if (assignment) {
    return assignment.usedCount >= assignment.maxUses
      ? `You have used this coupon the maximum number of times (${assignment.maxUses})`
      : null;
  }
  if (coupon.restricted) return 'This coupon is not available for your account';
  if (coupon.usedBy.some((id) => String(id) === String(userId))) return 'You have already used this coupon';
  return null;
}

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
