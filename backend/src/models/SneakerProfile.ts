import mongoose, { Schema, Document } from 'mongoose';

export interface ISneakerProfile extends Document {
  slug: string;
  name: string;
  brand: string;
  tagline: string;
  description: string;
  releaseYear: number | null;
  designer: string;
  silhouette: string;
  category: string;
  originalRetailPrice: number | null;
  searchTags: string[];
  relatedSlugs: string[];
  image: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SneakerProfileSchema = new Schema<ISneakerProfile>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    releaseYear: { type: Number, default: null },
    designer: { type: String, default: '' },
    silhouette: { type: String, default: '' },
    category: { type: String, default: '' },
    originalRetailPrice: { type: Number, default: null },
    searchTags: [{ type: String }],
    relatedSlugs: [{ type: String }],
    image: { type: String, default: '' },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SneakerProfile = mongoose.model<ISneakerProfile>('SneakerProfile', SneakerProfileSchema);
