import { Counter } from '../models/Counter';

/**
 * Atomically increment and return the next sequence number for a given counter.
 * Uses findOneAndUpdate with upsert for lock-free concurrency safety.
 */
export const getNextSequence = async (counterName: string): Promise<number> => {
  const counter = await Counter.findOneAndUpdate(
    { _id: counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

/**
 * Generate collision-safe Order ID: ORD-YYYY-XXXX
 */
export const generateOrderId = async (): Promise<string> => {
  const seq = await getNextSequence('orderId');
  const year = new Date().getFullYear();
  return `ORD-${year}-${String(seq).padStart(4, '0')}`;
};

/**
 * Generate collision-safe Batch Number: BATCH-YYYY-XXX
 */
export const generateBatchNumber = async (): Promise<string> => {
  const seq = await getNextSequence('batchNumber');
  const year = new Date().getFullYear();
  return `BATCH-${year}-${String(seq).padStart(3, '0')}`;
};

/**
 * Generate collision-safe Settlement ID: STL-YYYY-XXXX
 */
export const generateSettlementId = async (): Promise<string> => {
  const seq = await getNextSequence('settlementId');
  const year = new Date().getFullYear();
  return `STL-${year}-${String(seq).padStart(4, '0')}`;
};

/**
 * Generate collision-safe Farmer ID: BP-XXXX (starting from 1001)
 */
export const generateFarmerSequenceId = async (): Promise<string> => {
  const seq = await getNextSequence('farmerId');
  return `BP-${String(1000 + seq).padStart(4, '0')}`;
};
