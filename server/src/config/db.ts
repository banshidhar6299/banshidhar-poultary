import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { AISettings } from '../models/AISettings';

/**
 * Ensure default Admin account and initial system settings exist
 * on fresh database deployments without needing to run destructive seed scripts.
 */
export const ensureInitialData = async (): Promise<void> => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      await Admin.create({
        username: 'admin',
        email: 'admin@banshidharpoultry.com',
        passwordHash,
        name: 'Banshidhar Poultry Admin',
        phone: '+91 9876543210',
        role: 'ADMIN'
      });
      console.log('[Setup] Initial default Admin created (Username: admin, Password: admin123)');
    }

    const settingsCount = await WebsiteSettings.countDocuments();
    if (settingsCount === 0) {
      await WebsiteSettings.create({});
      console.log('[Setup] Initial Website Settings initialized');
    }

    const aiSettingsCount = await AISettings.countDocuments();
    if (aiSettingsCount === 0) {
      await AISettings.create({});
      console.log('[Setup] Initial AI Settings initialized');
    }
  } catch (error) {
    console.error('[Setup] Error initializing default data:', error);
  }
};

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
      await ensureInitialData();
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
