const requiredInProduction = [
  'MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL', 'SERVER_URL', 'BREVO_API_KEY',
  'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'
] as const;

export const validateEnvironment = (): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing = requiredInProduction.filter((key) => !process.env[key]?.trim());
  if (isProduction && missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
};

export const getAllowedOrigins = (): string[] => {
  const configured = process.env.CLIENT_URL?.split(',').map((value) => value.trim()).filter(Boolean) || [];
  return configured.length ? configured : ['http://localhost:5173'];
};

export const isOriginAllowed = (origin?: string): boolean =>
  !origin || getAllowedOrigins().includes(origin);
