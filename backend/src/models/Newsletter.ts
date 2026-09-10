import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletter extends Document {
  email?: string;
  name?: string;
  phone?: string;
  source: 'subscribed' | 'uploaded';
  unsubscribed: boolean;
  unsubscribedAt?: Date;
  bounced: boolean;
  bouncedAt?: Date;
  createdAt: Date;
}

const NewsletterSchema = new Schema<INewsletter>(
  {
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    source: { type: String, enum: ['subscribed', 'uploaded'], default: 'subscribed', index: true },
    unsubscribed: { type: Boolean, default: false, index: true },
    unsubscribedAt: { type: Date },
    bounced: { type: Boolean, default: false, index: true },
    bouncedAt: { type: Date },
  },
  { timestamps: true }
);

export const Newsletter = mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
