import { Schema } from 'mongoose';

export interface IShipmentCheckpoint {
  message: string;
  location: string;
  at: Date | null;
  tag: string;
  subtagMessage: string;
}

export interface IShipment {
  aftershipId: string;
  slug: string;
  tag: string;
  subtag: string;
  subtagMessage: string;
  expectedDelivery: string;
  lastCheckpoint: IShipmentCheckpoint | null;
  checkpoints: IShipmentCheckpoint[];
  syncedAt: Date | null;
}

const CheckpointSchema = new Schema<IShipmentCheckpoint>(
  {
    message: { type: String, default: '' },
    location: { type: String, default: '' },
    at: { type: Date, default: null },
    tag: { type: String, default: '' },
    subtagMessage: { type: String, default: '' },
  },
  { _id: false }
);

export const ShipmentSchema = new Schema<IShipment>(
  {
    aftershipId: { type: String, default: '' },
    slug: { type: String, default: '' },
    tag: { type: String, default: '' },
    subtag: { type: String, default: '' },
    subtagMessage: { type: String, default: '' },
    expectedDelivery: { type: String, default: '' },
    lastCheckpoint: { type: CheckpointSchema, default: null },
    checkpoints: { type: [CheckpointSchema], default: [] },
    syncedAt: { type: Date, default: null },
  },
  { _id: false }
);
