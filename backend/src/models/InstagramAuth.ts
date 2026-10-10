import mongoose, { Schema, Document } from 'mongoose';

// One document holding the refreshed Instagram access token, encrypted with
// IG_TOKEN_KEY (AES-256-GCM). envTokenHash is the SHA-256 of IG_ACCESS_TOKEN
// at the time of the last refresh: pasting a new token into the env replaces
// whatever is stored here.
export interface IInstagramAuth extends Document {
  key: string;
  envTokenHash: string;
  tokenCipher: string;
  tokenIv: string;
  tokenTag: string;
  expiresAt: Date | null;
  refreshedAt: Date | null;
  lastError: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstagramAuthSchema = new Schema<IInstagramAuth>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    envTokenHash: { type: String, default: '' },
    tokenCipher: { type: String, default: '' },
    tokenIv: { type: String, default: '' },
    tokenTag: { type: String, default: '' },
    expiresAt: { type: Date, default: null },
    refreshedAt: { type: Date, default: null },
    lastError: { type: String, default: '' },
  },
  { timestamps: true }
);

export const InstagramAuth = mongoose.model<IInstagramAuth>('InstagramAuth', InstagramAuthSchema);
