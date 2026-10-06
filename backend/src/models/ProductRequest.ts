import mongoose, { Schema, Document } from 'mongoose';

export type ProductRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IProductRequest extends Document {
  seller: mongoose.Types.ObjectId;
  name: string;
  brand: string;
  colorway: string;
  sizes: string[];
  supportingUrls: string[];
  note: string;
  status: ProductRequestStatus;
  adminNote: string;
  product: mongoose.Types.ObjectId | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProductRequestSchema = new Schema<IProductRequest>(
  {
    seller: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    colorway: { type: String, default: '', trim: true },
    sizes: { type: [String], default: [] },
    supportingUrls: { type: [String], default: [] },
    note: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    adminNote: { type: String, default: '' },
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ProductRequest = mongoose.model<IProductRequest>('ProductRequest', ProductRequestSchema);
