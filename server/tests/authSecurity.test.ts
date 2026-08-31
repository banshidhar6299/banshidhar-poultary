import { describe, expect, it } from 'vitest';
import { hashToken, generateRandomToken, createJWT, verifyJWT } from '../src/utils/helpers';
import { logger } from '../src/utils/logger';

describe('Authentication & Password Reset Security', () => {
  it('hashes tokens deterministically with SHA-256', () => {
    const token = 'test-token-12345';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).not.toBe(token);
  });

  it('generates random tokens of sufficient entropy (64 hex chars = 32 bytes)', () => {
    const t1 = generateRandomToken();
    const t2 = generateRandomToken();
    expect(t1).toHaveLength(64);
    expect(t2).toHaveLength(64);
    expect(t1).not.toBe(t2);
  });

  it('redacts sensitive fields in logger output', () => {
    const sensitivePayload = {
      username: 'admin',
      password: 'supersecretpassword',
      token: 'jwt.token.here',
      apiKey: 'secret-api-key',
      farmerId: 'BP-1001',
      details: {
        authorization: 'Bearer secret',
        other: 'normal-value'
      }
    };

    const redacted = logger.redactSensitive(sensitivePayload);
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.token).toBe('[REDACTED]');
    expect(redacted.apiKey).toBe('[REDACTED]');
    expect(redacted.details.authorization).toBe('[REDACTED]');
    expect(redacted.username).toBe('admin');
    expect(redacted.farmerId).toBe('BP-1001');
    expect(redacted.details.other).toBe('normal-value');
  });

  it('creates and verifies valid JWT tokens', () => {
    const payload = {
      userId: '507f1f77bcf86cd799439011',
      role: 'ADMIN' as const,
      username: 'admin',
      name: 'Banshidhar Admin'
    };

    const token = createJWT(payload);
    expect(token).toBeDefined();

    const verified = verifyJWT(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.role).toBe('ADMIN');
  });

  it('rejects invalid or tampered JWT tokens', () => {
    const verified = verifyJWT('invalid.tampered.token');
    expect(verified).toBeNull();
  });
});
