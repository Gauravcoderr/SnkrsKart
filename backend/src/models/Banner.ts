import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  brand: string;
  tag: string;
  headline: string[];
  sub: string;
  cta: string;
  href: string;
  image: string;
  accent: string;
  bg: string;
  imgBg: string;
  order: number;
  active: boolean;
  headlineFontSize: number;
  headlineFontWeight: number;
}

const BannerSchema = new Schema<IBanner>({
  brand:    { type: String, required: true },
  tag:      { type: String, required: true },
  headline: [{ type: String }],
  sub:      { type: String, required: true },
  cta:      { type: String, required: true },
  href:     { type: String, required: true },
  image:    { type: String, required: true },
  accent:   { type: String, default: '#ffffff' },
  bg:       { type: String, default: '#0a0a0a' },
  imgBg:    { type: String, default: '#1a1a1a' },
  order:    { type: Number, default: 0 },
  active:   { type: Boolean, default: true },
  headlineFontSize:   { type: Number, default: 8 },   // rem — hero word's max clamp size
  headlineFontWeight: { type: Number, default: 900 }, // 100-900
});

export const Banner = mongoose.model<IBanner>('Banner', BannerSchema);
