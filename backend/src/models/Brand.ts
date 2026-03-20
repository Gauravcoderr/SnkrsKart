import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  logoText: string;
  heroColor: string;
  description: string;
}

const BrandSchema = new Schema<IBrand>(
  {
    name:         { type: String, required: true },
    slug:         { type: String, required: true, unique: true, index: true },
    productCount: { type: Number, default: 0 },
    logoText:     { type: String, required: true },
    heroColor:    { type: String, default: '#18181b' },
    description:  { type: String, default: '' },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Brand = mongoose.model<IBrand>('Brand', BrandSchema);
