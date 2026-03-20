import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  productSlug: string;
  productName: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productSlug: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    name:        { type: String, required: true },
    rating:      { type: Number, required: true, min: 1, max: 5 },
    comment:     { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        (ret as any).id = ret._id.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
