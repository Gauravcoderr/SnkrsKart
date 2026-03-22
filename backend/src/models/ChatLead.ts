import mongoose, { Schema, Document } from 'mongoose';

export interface IChatLead extends Document {
  name: string;
  email: string;
  phone?: string;
  interests: string[];  // product names the user asked about
  capturedAt: Date;
}

const ChatLeadSchema = new Schema<IChatLead>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  phone: { type: String, trim: true },
  interests: { type: [String], default: [] },
  capturedAt: { type: Date, default: Date.now },
});

export default mongoose.models.ChatLead || mongoose.model<IChatLead>('ChatLead', ChatLeadSchema);
