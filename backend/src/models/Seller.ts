import mongoose, { Schema, Document } from 'mongoose';

export interface ISeller extends Document {
  name: string;
  email: string;
  phone: string;
  brandsSell?: string;
  pairsCount?: string;
  message?: string;
  createdAt: Date;
}

const SellerSchema = new Schema<ISeller>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    brandsSell: { type: String, default: '' },
    pairsCount: { type: String, default: '' },
    message: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Seller = mongoose.model<ISeller>('Seller', SellerSchema);
