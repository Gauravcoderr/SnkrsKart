import mongoose, { Document, Schema } from 'mongoose';
import { SCRAPED_SITES, ScrapedSite } from './ScrapedProduct';

export interface IScrapedPricePoint extends Document {
  listing: mongoose.Types.ObjectId;
  sourceSite: ScrapedSite;
  price: number;
  at: Date;
}

const scrapedPricePointSchema = new Schema<IScrapedPricePoint>({
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'ScrapedProduct',
    required: true,
  },
  sourceSite: { type: String, enum: SCRAPED_SITES, required: true },
  price: { type: Number, required: true },
  at: { type: Date, required: true, default: Date.now },
});

scrapedPricePointSchema.index({ listing: 1, at: -1 });
scrapedPricePointSchema.index({ at: 1 });

export const ScrapedPricePoint = mongoose.model<IScrapedPricePoint>('ScrapedPricePoint', scrapedPricePointSchema);
