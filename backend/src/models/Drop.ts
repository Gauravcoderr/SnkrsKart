import mongoose, { Schema, Document } from 'mongoose';

export interface IDrop extends Document {
  slug: string;
  name: string;
  brand: string;
  colorway: string;
  releaseDate: Date;
  retailPrice: number | null;
  currency: 'INR' | 'USD';
  image: string;
  description: string;
  where: string;
  availableAtStore: boolean;
  productSlug: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DropSchema = new Schema<IDrop>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    colorway: { type: String, default: '' },
    releaseDate: { type: Date, required: true },
    retailPrice: { type: Number, default: null },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    where: { type: String, default: '' },
    availableAtStore: { type: Boolean, default: false },
    productSlug: { type: String, default: '' },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Drop = mongoose.model<IDrop>('Drop', DropSchema);
