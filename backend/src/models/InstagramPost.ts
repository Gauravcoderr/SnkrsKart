import mongoose, { Schema, Document } from 'mongoose';
import { IG_KINDS, IG_SOURCE_KINDS, IgKind, IgMediaItem, IgSourceKind } from '../lib/instagramRules';
import { IG_STATUSES, IgStatus } from '../lib/instagramState';

export interface IInstagramPost extends Document {
  kind: IgKind;
  caption: string;
  media: IgMediaItem[];
  coverUrl: string;
  status: IgStatus;
  scheduledAt: Date | null;
  source: { kind: IgSourceKind; slug: string };
  notes: string;
  attempts: number;
  lastAttemptAt: Date | null;
  error: string;
  igMediaId: string;
  permalink: string;
  dryRun: boolean;
  approvedBy: string;
  approvedAt: Date | null;
  publishedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IgMediaItem>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['IMAGE', 'VIDEO'], default: 'IMAGE' },
    altText: { type: String, default: '' },
  },
  { _id: false }
);

const InstagramPostSchema = new Schema<IInstagramPost>(
  {
    kind: { type: String, enum: IG_KINDS, required: true },
    caption: { type: String, default: '' },
    media: { type: [MediaSchema], default: [] },
    coverUrl: { type: String, default: '' },
    status: { type: String, enum: IG_STATUSES, default: 'draft', index: true },
    scheduledAt: { type: Date, default: null },
    source: {
      kind: { type: String, enum: IG_SOURCE_KINDS, default: 'manual' },
      slug: { type: String, default: '' },
    },
    notes: { type: String, default: '' },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    error: { type: String, default: '' },
    igMediaId: { type: String, default: '' },
    permalink: { type: String, default: '' },
    dryRun: { type: Boolean, default: false },
    approvedBy: { type: String, default: '' },
    approvedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    createdBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

InstagramPostSchema.index({ status: 1, scheduledAt: 1 });
InstagramPostSchema.index({ 'source.kind': 1, 'source.slug': 1 });

export const InstagramPost = mongoose.model<IInstagramPost>('InstagramPost', InstagramPostSchema);
