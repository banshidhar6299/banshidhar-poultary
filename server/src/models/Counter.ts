import mongoose, { Schema } from 'mongoose';

/**
 * Atomic counter collection for collision-safe sequential IDs.
 * Uses findOneAndUpdate with $inc for atomic increment.
 */
export interface ICounter {
  _id: string; // Counter name, e.g. 'orderId', 'batchNumber', 'settlementId', 'farmerId'
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);
