import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types';

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

export const generateFarmerId = (nextSequence: number): string => {
  return `BP-${String(nextSequence).padStart(4, '0')}`;
};

export const generateTemporaryPassword = (length = 8): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};

export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const createJWT = (payload: AuthPayload): string => {
  const secret = process.env.JWT_SECRET || 'banshidhar_poultry_default_secret_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyJWT = (token: string): AuthPayload | null => {
  try {
    const secret = process.env.JWT_SECRET || 'banshidhar_poultry_default_secret_key_2026';
    return jwt.verify(token, secret) as AuthPayload;
  } catch {
    return null;
  }
};

export const roundPaise = (amount: number): number => {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};
