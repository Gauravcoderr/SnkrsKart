import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  published: boolean;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    author: { type: String, default: 'SNKRS CART' },
    tags: [{ type: String }],
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' },
    published: { type: Boolean, default: false },
    wordCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BlogSchema.pre('save', async function () {
  this.wordCount = (this.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
});

export const Blog = mongoose.model<IBlog>('Blog', BlogSchema);
