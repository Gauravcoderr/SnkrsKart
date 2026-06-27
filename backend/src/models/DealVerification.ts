import mongoose, { Schema, Document } from 'mongoose';

export interface IDealVerification extends Document {
  productId: mongoose.Types.ObjectId;
  productSlug: string;
  productName: string;
  submittedUrl: string;
  urlMeta: {
    title?: string;
    siteName?: string;
    favicon?: string;
    ogImage?: string;
  };
  screenshotUrl: string;
  userEmail: string;
  status: 'pending' | 'real' | 'fake' | 'inconclusive';
  adminNote?: string;
  submittedAt: Date;
  reviewedAt?: Date;
}

const DealVerificationSchema = new Schema<IDealVerification>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productSlug: { type: String, required: true },
  productName: { type: String, required: true },
  submittedUrl: { type: String, required: true },
  urlMeta: {
    title: String,
    siteName: String,
    favicon: String,
    ogImage: String,
  },
  screenshotUrl: { type: String, required: true },
  userEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'real', 'fake', 'inconclusive'], default: 'pending' },
  adminNote: String,
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
});

export const DealVerification = mongoose.model<IDealVerification>('DealVerification', DealVerificationSchema);
