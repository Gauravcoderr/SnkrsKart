import mongoose, { Schema, Document } from 'mongoose';

export type SellerStatus = 'applied' | 'active' | 'suspended';

export interface ISeller extends Document {
  name: string;
  email: string;
  phone: string;
  brandsSell?: string;
  pairsCount?: string;
  message?: string;
  status: SellerStatus;
  passwordHash: string | null;
  mustChangePassword: boolean;
  businessName: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  whatsapp: string;
  upiId: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SellerSchema = new Schema<ISeller>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true },
    brandsSell: { type: String, default: '' },
    pairsCount: { type: String, default: '' },
    message: { type: String, default: '' },
    status: { type: String, enum: ['applied', 'active', 'suspended'], default: 'applied', index: true },
    passwordHash: { type: String, default: null },
    mustChangePassword: { type: Boolean, default: false },
    businessName: { type: String, default: '' },
    addressLine: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    upiId: { type: String, default: '' },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Seller = mongoose.model<ISeller>('Seller', SellerSchema);
