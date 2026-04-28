import mongoose, { Schema, Document } from 'mongoose';

export interface ILoyaltyEvent {
  type: 'earn' | 'redeem';
  amount: number;
  reason: string;
  orderId?: string;
  createdAt: Date;
}

export interface ILoyalty extends Document {
  userId: mongoose.Types.ObjectId;
  coins: number;
  history: ILoyaltyEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export type LoyaltyTier = 'rookie' | 'enthusiast' | 'og';

export function getTier(coins: number): LoyaltyTier {
  if (coins >= 2000) return 'og';
  if (coins >= 500) return 'enthusiast';
  return 'rookie';
}

// Coins earned per ₹100 spent (base rate)
export const COINS_PER_100 = 1;
// 100 coins = ₹100 discount
export const COINS_TO_RUPEE = 1;
// Max redemption: 20% of order total
export const MAX_REDEEM_PCT = 0.2;
// Minimum coins to redeem
export const MIN_REDEEM = 100;

const LoyaltyEventSchema = new Schema<ILoyaltyEvent>({
  type:    { type: String, enum: ['earn', 'redeem'], required: true },
  amount:  { type: Number, required: true },
  reason:  { type: String, required: true },
  orderId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const LoyaltySchema = new Schema<ILoyalty>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    coins:  { type: Number, default: 0, min: 0 },
    history: { type: [LoyaltyEventSchema], default: [] },
  },
  { timestamps: true }
);

export const Loyalty = mongoose.model<ILoyalty>('Loyalty', LoyaltySchema);
