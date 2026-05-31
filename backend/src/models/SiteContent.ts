import mongoose, { Schema, Document } from 'mongoose';

export interface IFaqItem {
  q: string;
  a: string;
}

export interface ISiteContent extends Document {
  pageKey: string;
  label: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  htmlContent: string;
  faqItems: IFaqItem[];
  updatedAt: Date;
}

const FaqItemSchema = new Schema<IFaqItem>({ q: String, a: String }, { _id: false });

const SiteContentSchema = new Schema<ISiteContent>(
  {
    pageKey: { type: String, required: true, unique: true },
    label: { type: String, default: '' },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    htmlContent: { type: String, default: '' },
    faqItems: { type: [FaqItemSchema], default: [] },
  },
  { timestamps: true }
);

export const SiteContent = mongoose.model<ISiteContent>('SiteContent', SiteContentSchema);
