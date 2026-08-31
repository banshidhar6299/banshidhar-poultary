import mongoose from 'mongoose';

/**
 * Run a callback within a MongoDB transaction (replica set required).
 * Falls back to running without a transaction in local/standalone environments.
 */
export const runInTransaction = async <T>(
  callback: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
