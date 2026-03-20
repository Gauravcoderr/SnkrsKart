import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress {
  _id?: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  email: string;
  name: string;
  phone: string;
  addresses: IAddress[];
  otp: string | null;
  otpExpiry: Date | null;
  otpAttempts: number;
  lastOtpSent: Date | null;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    addresses: [AddressSchema],
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    lastOtpSent: { type: Date, default: null },
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
