import mongoose, { Document, Schema } from 'mongoose';

export const SCRAPED_SITES = [
  'myntra', 'footlocker', 'vegnonveg', 'limitededt', 'superkicks', 'nike', 'tatacliq', 'tatacliqluxury', 'ajio',
] as const;
export type ScrapedSite = typeof SCRAPED_SITES[number];

export const SCRAPED_BRANDS = ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Crocs'] as const;
export type ScrapedBrand = typeof SCRAPED_BRANDS[number];

export interface IScrapedProduct extends Document {
  sourceUrl: string;
  sourceSite: ScrapedSite;
  name: string;
  brand: ScrapedBrand;
  price?: number;
  originalPrice?: number;
  images: string[];
  sizes: string[];
  colorway?: string;
  sku?: string;
  description?: string;
  gender: 'men' | 'women' | 'unisex' | 'kids';
  tags: string[];
  flags: string[];
  sourceListedAt?: Date;
  sourceUpdatedAt?: Date;
  status: 'draft' | 'published' | 'rejected';
  publishedProductId?: mongoose.Types.ObjectId;
  scrapedAt: Date;
}

const scrapedProductSchema = new Schema<IScrapedProduct>(
  {
    sourceUrl: { type: String, required: true, unique: true },
    sourceSite: {
      type: String,
      enum: SCRAPED_SITES,
      required: true,
    },
    name: { type: String, required: true },
    brand: { type: String, enum: SCRAPED_BRANDS, required: true },
    price: { type: Number },
    originalPrice: { type: Number },
    images: [{ type: String }],
    sizes: [{ type: String }],
    colorway: { type: String },
    sku: { type: String },
    description: { type: String },
    gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'], default: 'unisex' },
    tags: [{ type: String }],
    flags: [{ type: String }],
    sourceListedAt: { type: Date },
    sourceUpdatedAt: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'published', 'rejected'],
      default: 'draft',
      index: true,
    },
    publishedProductId: { type: Schema.Types.ObjectId, ref: 'Product' },
    scrapedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ScrapedProduct = mongoose.model<IScrapedProduct>('ScrapedProduct', scrapedProductSchema);
