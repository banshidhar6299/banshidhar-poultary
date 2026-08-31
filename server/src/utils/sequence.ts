import { Counter } from '../models/Counter';
import { Farmer } from '../models/Farmer';
import { Order } from '../models/Order';
import { ChickBatch } from '../models/ChickBatch';
import { BirdSale } from '../models/BirdSale';

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
  const year = new Date().getFullYear();
  while (true) {
    const seq = await getNextSequence('orderId');
    const candidateId = `ORD-${year}-${String(seq).padStart(4, '0')}`;
    const exists = await Order.exists({ orderId: candidateId });
    if (!exists) {
      return candidateId;
    }
  }
};

/**
 * Generate collision-safe Batch Number: BATCH-YYYY-XXX
 */
export const generateBatchNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  while (true) {
    const seq = await getNextSequence('batchNumber');
    const candidateId = `BATCH-${year}-${String(seq).padStart(3, '0')}`;
    const exists = await ChickBatch.exists({ batchNumber: candidateId });
    if (!exists) {
      return candidateId;
    }
  }
};

/**
 * Generate collision-safe Settlement ID: STL-YYYY-XXXX
 */
export const generateSettlementId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  while (true) {
    const seq = await getNextSequence('settlementId');
    const candidateId = `STL-${year}-${String(seq).padStart(4, '0')}`;
    const exists = await BirdSale.exists({ settlementId: candidateId });
    if (!exists) {
      return candidateId;
    }
  }
};

/**
 * Generate collision-safe Farmer ID: BP-XXXX (starting from 1001)
 */
export const generateFarmerSequenceId = async (): Promise<string> => {
  while (true) {
    const seq = await getNextSequence('farmerId');
    const candidateId = `BP-${String(1000 + seq).padStart(4, '0')}`;
    const exists = await Farmer.exists({ farmerId: candidateId });
    if (!exists) {
      return candidateId;
    }
  }
};
