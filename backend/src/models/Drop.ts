import mongoose, { Schema, Document } from 'mongoose';

export interface IDrop extends Document {
  slug: string;
  name: string;
  brand: string;
  colorway: string;
  releaseDate: Date;
  retailPrice: number | null;
  currency: 'INR' | 'USD';
  image: string;
  description: string;
  where: string;
  availableAtStore: boolean;
  productSlug: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DropSchema = new Schema<IDrop>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    colorway: { type: String, default: '' },
    releaseDate: { type: Date, required: true },
    retailPrice: { type: Number, default: null },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    where: { type: String, default: '' },
    availableAtStore: { type: Boolean, default: false },
    productSlug: { type: String, default: '' },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Sneaker retail prices under 1000 are always USD (no sneaker retails for ₹999 or less);
// anything at or above 1000 is INR. Keeps currency correct regardless of how price was set.
function deriveCurrency(price: number): 'INR' | 'USD' {
  return price < 1000 ? 'USD' : 'INR';
}

DropSchema.pre('save', async function () {
  if (this.retailPrice != null) this.currency = deriveCurrency(this.retailPrice);
});

DropSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() as Record<string, any> | null;
  if (!update) return;
  const price = update.retailPrice !== undefined ? update.retailPrice : update.$set?.retailPrice;
  if (price !== undefined && price !== null) {
    if (update.$set) update.$set.currency = deriveCurrency(price);
    else update.currency = deriveCurrency(price);
  }
});

export const Drop = mongoose.model<IDrop>('Drop', DropSchema);
