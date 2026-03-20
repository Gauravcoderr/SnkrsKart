import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  productSlug: string;
  productName: string;
  productBrand: string;
  selectedSize: number | null;
  price: number;
  createdAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    name:         { type: String, required: true },
    email:        { type: String, required: true },
    phone:        { type: String, required: true },
    address:      { type: String, required: true },
    productSlug:  { type: String, required: true },
    productName:  { type: String, required: true },
    productBrand: { type: String, required: true },
    selectedSize: { type: Number, default: null },
    price:        { type: Number, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const Inquiry = mongoose.model<IInquiry>('Inquiry', InquirySchema);
