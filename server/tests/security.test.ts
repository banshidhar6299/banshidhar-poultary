import { afterEach, describe, expect, it, vi } from 'vitest';
import { requireAdminOrFarmerOwner } from '../src/middlewares/auth';
import { getAllowedOrigins, isOriginAllowed, validateEnvironment } from '../src/config/env';

describe('production security controls', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects a farmer requesting another farmer record', () => {
    const req: any = { user: { role: 'FARMER', userId: 'farmer-a' }, params: { farmerId: 'farmer-b' }, query: {}, body: {} };
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const next = vi.fn();

    requireAdminOrFarmerOwner()(req, { status } as any, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows a farmer requesting their own record', () => {
    const req: any = { user: { role: 'FARMER', userId: 'farmer-a' }, params: { farmerId: 'farmer-a' }, query: {}, body: {} };
    const next = vi.fn();

    requireAdminOrFarmerOwner()(req, {} as any, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('only allows configured browser origins', () => {
    process.env.CLIENT_URL = 'https://app.example.com, https://admin.example.com';
    expect(getAllowedOrigins()).toEqual(['https://app.example.com', 'https://admin.example.com']);
    expect(isOriginAllowed('https://app.example.com')).toBe(true);
    expect(isOriginAllowed('https://evil.example.com')).toBe(false);
  });

  it('fails fast when production configuration is incomplete', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.CLIENT_URL;
    delete process.env.MONGODB_URI;
    expect(() => validateEnvironment()).toThrow(/Missing required production environment variables/);
  });

  it('rejects JWT_SECRET shorter than 32 chars in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://test';
    process.env.JWT_SECRET = 'short';
    process.env.CLIENT_URL = 'https://app.example.com';
    process.env.SERVER_URL = 'https://api.example.com';
    process.env.BREVO_API_KEY = 'test-key';
    process.env.BREVO_SENDER_EMAIL = 'test@example.com';
    process.env.CLOUDINARY_CLOUD_NAME = 'test';
    process.env.CLOUDINARY_API_KEY = 'test';
    process.env.CLOUDINARY_API_SECRET = 'test';
    expect(() => validateEnvironment()).toThrow(/JWT_SECRET must be at least 32 characters/);
  });

  it('rejects wildcard CORS in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://test';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.CLIENT_URL = '*';
    process.env.SERVER_URL = 'https://api.example.com';
    process.env.BREVO_API_KEY = 'test-key';
    process.env.BREVO_SENDER_EMAIL = 'test@example.com';
    process.env.CLOUDINARY_CLOUD_NAME = 'test';
    process.env.CLOUDINARY_API_KEY = 'test';
    process.env.CLOUDINARY_API_SECRET = 'test';
    expect(() => validateEnvironment()).toThrow(/Wildcard/);
  });

  it('rejects non-HTTPS CLIENT_URL in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://test';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.CLIENT_URL = 'http://app.example.com';
    process.env.SERVER_URL = 'https://api.example.com';
    process.env.BREVO_API_KEY = 'test-key';
    process.env.BREVO_SENDER_EMAIL = 'test@example.com';
    process.env.CLOUDINARY_CLOUD_NAME = 'test';
    process.env.CLOUDINARY_API_KEY = 'test';
    process.env.CLOUDINARY_API_SECRET = 'test';
    expect(() => validateEnvironment()).toThrow(/HTTPS/);
  });

  it('passes validation with all valid production config', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://test';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.CLIENT_URL = 'https://app.example.com';
    process.env.SERVER_URL = 'https://api.example.com';
    process.env.BREVO_API_KEY = 'test-key';
    process.env.BREVO_SENDER_EMAIL = 'test@example.com';
    process.env.CLOUDINARY_CLOUD_NAME = 'test';
    process.env.CLOUDINARY_API_KEY = 'test';
    process.env.CLOUDINARY_API_SECRET = 'test';
    expect(() => validateEnvironment()).not.toThrow();
  });

  it('allows development mode without any env vars set', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    expect(() => validateEnvironment()).not.toThrow();
  });
});
