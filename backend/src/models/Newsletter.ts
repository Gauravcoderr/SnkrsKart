import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletter extends Document {
  email?: string;
  name?: string;
  phone?: string;
  source: 'subscribed' | 'uploaded';
  createdAt: Date;
}

const NewsletterSchema = new Schema<INewsletter>(
  {
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    source: { type: String, enum: ['subscribed', 'uploaded'], default: 'subscribed', index: true },
  },
  { timestamps: true }
);

export const Newsletter = mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
