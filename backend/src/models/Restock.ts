import mongoose, { Schema, Document } from 'mongoose';

export interface IRestock extends Document {
  email: string;
  productSlug: string;
  size: number | null;
  createdAt: Date;
}

const RestockSchema = new Schema<IRestock>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    productSlug: { type: String, required: true, trim: true },
    size: { type: Number, default: null },
  },
  { timestamps: true }
);

// Prevent duplicate signups for the same product+size+email combo
RestockSchema.index({ email: 1, productSlug: 1, size: 1 }, { unique: true });

export const Restock = mongoose.model<IRestock>('Restock', RestockSchema);
