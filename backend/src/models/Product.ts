import mongoose, { Schema, Document } from 'mongoose';

export interface IVariant {
  size: number | string;
  price: number;
  originalPrice: number | null;
  maxQty: number;
}

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
  stringSizes: string[];
  availableStringSizes: string[];
  productType: 'shoes' | 'clothing' | 'accessories';
  colors: string[];
  tags: string[];
  variants: IVariant[];
  faqs: Array<{ question: string; answer: string }>;
  featured: boolean;
  trending: boolean;
  trendingSince: Date | null;
  newArrival: boolean;
  soldOut: boolean;
  comingSoon: boolean;
  rating: number;
  reviewCount: number;
  description: string;
  category: string;
  sku: string;
  sourceUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords: string[];
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
    sizes:                [{ type: Number }],
    availableSizes:       [{ type: Number }],
    stringSizes:          [{ type: String }],
    availableStringSizes: [{ type: String }],
    productType:          { type: String, enum: ['shoes', 'clothing', 'accessories'], default: 'shoes', index: true },
    colors:        [{ type: String }],
    tags:          [{ type: String }],
    variants:      [{ size: { type: Schema.Types.Mixed }, price: Number, originalPrice: { type: Number, default: null }, maxQty: { type: Number, default: 1 } }],
    faqs:          [{ question: { type: String, default: '' }, answer: { type: String, default: '' } }],
    featured:      { type: Boolean, default: false, index: true },
    trending:      { type: Boolean, default: false, index: true },
    trendingSince: { type: Date, default: null },
    newArrival:    { type: Boolean, default: false, index: true },
    soldOut:       { type: Boolean, default: false },
  comingSoon:    { type: Boolean, default: false, index: true },
    rating:        { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:   { type: Number, default: 0 },
    description:   { type: String, required: true },
    category:      { type: String, required: true, index: true },
    sku:           { type: String, required: true, unique: true },
    // Admin-only: where this listing was resold/sourced from. Never exposed on public product routes.
    sourceUrl:     { type: String, required: false },
    metaTitle:       { type: String, required: false },
    metaDescription: { type: String, required: false },
    metaKeywords:    [{ type: String }],
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

ProductSchema.index({ productType: 1, comingSoon: -1, soldOut: 1, reviewCount: -1 });

// Text search index for name, brand, colorway, tags
ProductSchema.index({ name: 'text', brand: 'text', colorway: 'text', tags: 'text' });

// Compound indexes matching the actual sort order: comingSoon:-1, soldOut:1, then user sort
ProductSchema.index({ gender: 1, comingSoon: -1, soldOut: 1, reviewCount: -1 }); // popular (default)
ProductSchema.index({ gender: 1, comingSoon: -1, soldOut: 1, createdAt: -1 });   // newest
ProductSchema.index({ gender: 1, comingSoon: -1, soldOut: 1, price: 1 });        // price_asc
ProductSchema.index({ gender: 1, comingSoon: -1, soldOut: 1, price: -1 });       // price_desc
// Without gender filter (browse all)
ProductSchema.index({ comingSoon: -1, soldOut: 1, reviewCount: -1 });
// For featured / newArrival / trending sub-routes
ProductSchema.index({ featured: 1, reviewCount: -1 });
ProductSchema.index({ newArrival: 1, createdAt: -1 });
ProductSchema.index({ trending: 1, trendingSince: -1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
