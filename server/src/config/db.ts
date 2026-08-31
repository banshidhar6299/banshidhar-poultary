import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banshidhar_poultry';
  
  const options = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    family: 4
  };

  let connected = false;
  let retries = 5;

  while (!connected && retries > 0) {
    try {
      const conn = await mongoose.connect(mongoURI, options);
      console.log(`[Database] MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
      connected = true;
    } catch (error: any) {
      retries -= 1;
      console.error(`[Database] MongoDB Connection Attempt Failed (${retries} retries left):`, error.message);
      if (retries === 0) {
        console.error('[Database] All MongoDB Connection Attempts Failed:', error);
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
};
