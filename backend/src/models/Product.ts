import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  id: string;
  slug: string;
  name: string;
  brand: string;
  colorway: string;
  gender: 'men' | 'women' | 'unisex' | 'kids';
  price: number;
  originalPrice: number | null;
  discount: number | null;
  images: string[];
  hoverImage: string;
  sizes: number[];
  availableSizes: number[];
  colors: string[];
  tags: string[];
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
  soldOut: boolean;
  rating: number;
  reviewCount: number;
  description: string;
  category: string;
  sku: string;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    slug:          { type: String, required: true, unique: true, index: true },
    name:          { type: String, required: true },
    brand:         { type: String, required: true, index: true },
    colorway:      { type: String, required: true },
    gender:        { type: String, enum: ['men', 'women', 'unisex', 'kids'], required: true, index: true },
    price:         { type: Number, required: true },
    originalPrice: { type: Number, default: null },
    discount:      { type: Number, default: null },
    images:        [{ type: String }],
    hoverImage:    { type: String, required: true },
    sizes:         [{ type: Number }],
    availableSizes:[{ type: Number }],
    colors:        [{ type: String }],
    tags:          [{ type: String }],
    featured:      { type: Boolean, default: false, index: true },
    trending:      { type: Boolean, default: false, index: true },
    newArrival:    { type: Boolean, default: false, index: true },
    soldOut:       { type: Boolean, default: false },
    rating:        { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:   { type: Number, default: 0 },
    description:   { type: String, required: true },
    category:      { type: String, required: true, index: true },
    sku:           { type: String, required: true, unique: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Text search index for name, brand, colorway, tags
ProductSchema.index({ name: 'text', brand: 'text', colorway: 'text', tags: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
