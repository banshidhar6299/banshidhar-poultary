import crypto from 'crypto';

/**
 * Strict production environment validation.
 * In production: fails startup when any mandatory variable is missing or invalid.
 * In development: uses sensible fallbacks.
 */
export const validateEnvironment = (): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Auto-detect SERVER_URL on Render/cloud platforms if not explicitly provided
    if (!process.env.SERVER_URL?.trim()) {
      if (process.env.RENDER_EXTERNAL_URL) {
        process.env.SERVER_URL = process.env.RENDER_EXTERNAL_URL;
      } else if (process.env.RENDER_EXTERNAL_HOSTNAME) {
        process.env.SERVER_URL = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
      }
    }

    if (!process.env.BREVO_SENDER_EMAIL?.trim()) {
      process.env.BREVO_SENDER_EMAIL = 'noreply@banshidharpoultry.com';
    }

    // ── Mandatory variables in production ──────────────────────────────
    const required: string[] = [
      'MONGODB_URI',
      'JWT_SECRET',
      'CLIENT_URL',
      'SERVER_URL',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];

    const missing = required.filter((key) => !process.env[key]?.trim());
    if (missing.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${missing.join(', ')}. ` +
        'Set these in your deployment dashboard (e.g. Render).'
      );
    }

    if (!process.env.BREVO_API_KEY?.trim()) {
      console.warn('[Env] Notice: BREVO_API_KEY is not set. Password reset emails will be disabled until configured.');
    }

    // ── JWT_SECRET strength ────────────────────────────────────────────
    if (process.env.JWT_SECRET!.trim().length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters in production. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }

    // ── Wildcard CORS forbidden ────────────────────────────────────────
    const clientOrigins = getAllowedOrigins();
    if (clientOrigins.includes('*')) {
      throw new Error('Wildcard (*) CORS origin is not allowed in production. Set CLIENT_URL explicitly.');
    }

    // ── HTTPS URL validation ───────────────────────────────────────────
    for (const origin of clientOrigins) {
      if (!origin.startsWith('https://')) {
        throw new Error(
          `CLIENT_URL origin "${origin}" must use HTTPS in production.`
        );
      }
    }

    if (!process.env.SERVER_URL!.startsWith('https://')) {
      throw new Error('SERVER_URL must use HTTPS in production.');
    }

    console.log('[Env] Production environment validated successfully.');
    return;
  }

  // ── Development fallbacks ──────────────────────────────────────────
  if (!process.env.MONGODB_URI?.trim()) {
    console.warn('[Env] Warning: MONGODB_URI is not set. Using local mongodb fallback.');
    process.env.MONGODB_URI = 'mongodb://localhost:27017/banshidhar_poultry';
  }

  if (!process.env.JWT_SECRET?.trim()) {
    process.env.JWT_SECRET = 'dev_secret_key_banshidhar_poultry_super_secure_123';
  }

  if (!process.env.SERVER_URL?.trim()) {
    if (process.env.RENDER_EXTERNAL_URL) {
      process.env.SERVER_URL = process.env.RENDER_EXTERNAL_URL;
    } else if (process.env.RENDER_EXTERNAL_HOSTNAME) {
      process.env.SERVER_URL = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
    } else {
      process.env.SERVER_URL = `http://localhost:${process.env.PORT || 5050}`;
    }
  }

  if (!process.env.BREVO_API_KEY?.trim()) {
    console.warn('[Env] Notice: BREVO_API_KEY is not set. Password reset links will be simulated in server logs.');
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME?.trim()) {
    console.warn('[Env] Notice: Cloudinary credentials not set. Uploads will be stored locally in /uploads.');
  }
};

/**
 * Parse CLIENT_URL into a list of allowed origins.
 * Supports multiple comma-separated origins.
 */
export const getAllowedOrigins = (): string[] => {
  const raw = process.env.CLIENT_URL?.trim();
  if (!raw || raw === '*') {
    return ['*'];
  }
  const configured = raw.split(',').map((value) => value.trim()).filter(Boolean);
  return configured.length ? configured : ['*'];
};

/**
 * Check if a given origin is allowed by CORS configuration.
 */
export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  if (allowed.includes('*')) return true;
  return allowed.includes(origin);
};
