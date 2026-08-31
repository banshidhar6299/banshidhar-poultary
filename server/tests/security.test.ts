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
    expect(() => validateEnvironment()).toThrow(/Missing required production environment variables/);
  });
});
