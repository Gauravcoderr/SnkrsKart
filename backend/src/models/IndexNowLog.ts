import mongoose, { Document, Schema } from 'mongoose';

export interface IIndexNowLog extends Document {
  path: string;
  pingedAt: Date;
}

const indexNowLogSchema = new Schema<IIndexNowLog>({
  path: { type: String, required: true, unique: true, index: true },
  pingedAt: { type: Date, default: Date.now },
});

export const IndexNowLog = mongoose.model<IIndexNowLog>('IndexNowLog', indexNowLogSchema);
