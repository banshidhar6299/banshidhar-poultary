import crypto from 'crypto';

export const validateEnvironment = (): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Only MONGODB_URI is strictly mandatory to boot the database
  if (!process.env.MONGODB_URI?.trim()) {
    if (isProduction) {
      throw new Error('Missing required environment variable: MONGODB_URI. Please set MONGODB_URI in Render dashboard.');
    } else {
      console.warn('[Env] Warning: MONGODB_URI is not set. Using local mongodb fallback.');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/banshidhar_poultry';
    }
  }

  // Ensure JWT_SECRET exists
  if (!process.env.JWT_SECRET?.trim()) {
    if (isProduction) {
      console.warn('[Env] Warning: JWT_SECRET not set in production. Generating secure runtime secret.');
      process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
    } else {
      process.env.JWT_SECRET = 'dev_secret_key_banshidhar_poultry_super_secure_123';
    }
  }

  // Auto-detect SERVER_URL on Render if not explicitly provided
  if (!process.env.SERVER_URL?.trim()) {
    if (process.env.RENDER_EXTERNAL_URL) {
      process.env.SERVER_URL = process.env.RENDER_EXTERNAL_URL;
    } else if (process.env.RENDER_EXTERNAL_HOSTNAME) {
      process.env.SERVER_URL = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
    } else {
      process.env.SERVER_URL = `http://localhost:${process.env.PORT || 10000}`;
    }
  }

  // Log optional service warnings on startup
  if (!process.env.BREVO_API_KEY?.trim()) {
    console.warn('[Env] Notice: BREVO_API_KEY is not set. Password reset links will be simulated in server logs.');
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME?.trim()) {
    console.warn('[Env] Notice: Cloudinary credentials not set. Uploads will be stored locally in /uploads.');
  }
};

export const getAllowedOrigins = (): string[] => {
  const raw = process.env.CLIENT_URL?.trim();
  if (!raw || raw === '*') {
    return ['*'];
  }
  const configured = raw.split(',').map((value) => value.trim()).filter(Boolean);
  return configured.length ? configured : ['*'];
};

export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  if (allowed.includes('*')) return true;
  return allowed.includes(origin);
};
