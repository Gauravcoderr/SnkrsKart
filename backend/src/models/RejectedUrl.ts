import mongoose, { Document, Schema } from 'mongoose';

export interface IRejectedUrl extends Document {
  sourceUrl: string;
  sku?: string;
  rejectedAt: Date;
}

const rejectedUrlSchema = new Schema<IRejectedUrl>({
  sourceUrl: { type: String, required: true, unique: true, index: true },
  sku: { type: String, index: true },
  rejectedAt: { type: Date, default: Date.now },
});

export const RejectedUrl = mongoose.model<IRejectedUrl>('RejectedUrl', rejectedUrlSchema);
