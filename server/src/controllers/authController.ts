import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin';
import { Farmer } from '../models/Farmer';
import { PasswordResetToken } from '../models/AuditLog';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../types';
import { createJWT, generateRandomToken, hashToken } from '../utils/helpers';
import { sendPasswordResetEmail } from '../services/emailService';
import { logger } from '../utils/logger';

// In-Memory Brute-Force Rate Limiter & Lockout Tracker (Max 10 attempts -> 15 min lock)
interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockUntil: number | null;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

const checkLoginLockout = (key: string): { locked: boolean; remainingSec: number } => {
  const attempt = loginAttempts.get(key);
  if (!attempt || !attempt.lockUntil) return { locked: false, remainingSec: 0 };
  const now = Date.now();
  if (now < attempt.lockUntil) {
    const remainingSec = Math.ceil((attempt.lockUntil - now) / 1000);
    return { locked: true, remainingSec };
  }
  // Lock expired, reset
  loginAttempts.delete(key);
  return { locked: false, remainingSec: 0 };
};

const recordFailedAttempt = (key: string): { locked: boolean; remainingSec: number; attemptsLeft: number } => {
  const now = Date.now();
  let attempt = loginAttempts.get(key);
  if (!attempt) {
    attempt = { count: 0, lastAttempt: now, lockUntil: null };
  }
  attempt.count += 1;
  attempt.lastAttempt = now;
  if (attempt.count >= MAX_FAILED_ATTEMPTS) {
    attempt.lockUntil = now + LOCKOUT_DURATION_MS;
    loginAttempts.set(key, attempt);
    return { locked: true, remainingSec: Math.ceil(LOCKOUT_DURATION_MS / 1000), attemptsLeft: 0 };
  }
  loginAttempts.set(key, attempt);
  return { locked: false, remainingSec: 0, attemptsLeft: MAX_FAILED_ATTEMPTS - attempt.count };
};

const clearFailedAttempts = (key: string) => {
  loginAttempts.delete(key);
};

// Admin Login
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const lockKey = `admin_${cleanUsername}_${req.ip}`;

    // Check if locked
    const lockout = checkLoginLockout(lockKey);
    if (lockout.locked) {
      res.status(429).json({
        success: false,
        locked: true,
        remainingSec: lockout.remainingSec,
        message: `Too many failed attempts (10+). Account temporarily locked. Please try again after ${Math.ceil(lockout.remainingSec / 60)} minutes.`
      });
      return;
    }

    const admin = await Admin.findOne({
      $or: [{ username: cleanUsername }, { email: cleanUsername }]
    });

    if (!admin) {
      const fail = recordFailedAttempt(lockKey);
      const msg = fail.locked
        ? 'Too many failed attempts (10+). Account locked for 15 minutes.'
        : fail.attemptsLeft <= 2
        ? `Invalid admin credentials. (Warning: Only ${fail.attemptsLeft} attempts remaining before 15-min lockout)`
        : 'Invalid admin credentials.';

      res.status(401).json({
        success: false,
        locked: fail.locked,
        remainingSec: fail.remainingSec,
        attemptsLeft: fail.attemptsLeft,
        message: msg
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      const fail = recordFailedAttempt(lockKey);
      const msg = fail.locked
        ? 'Too many failed attempts (10+). Account locked for 15 minutes.'
        : fail.attemptsLeft <= 2
        ? `Invalid admin credentials. (Warning: Only ${fail.attemptsLeft} attempts remaining before 15-min lockout)`
        : 'Invalid admin credentials.';

      res.status(401).json({
        success: false,
        locked: fail.locked,
        remainingSec: fail.remainingSec,
        attemptsLeft: fail.attemptsLeft,
        message: msg
      });
      return;
    }

    // Success -> Clear lock tracker
    clearFailedAttempts(lockKey);

    const token = createJWT({
      userId: admin._id.toString(),
      role: 'ADMIN',
      username: admin.username,
      name: admin.name
    });

    await AuditLog.create({
      actorId: admin._id.toString(),
      actorName: admin.name,
      actorRole: 'ADMIN',
      action: 'ADMIN_LOGIN',
      entityType: 'Admin',
      entityId: admin._id.toString(),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        phone: admin.phone,
        role: 'ADMIN'
      }
    });
  } catch (error: any) {
    logger.error('Auth', 'Admin login error', error);
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
};

// Farmer Login
export const farmerLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Farmer ID / Mobile and password are required.' });
      return;
    }

    const cleanId = username.trim();
    const cleanDigits = cleanId.replace(/\D/g, '');
    const last10Digits = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : '';
    const lockKey = `farmer_${cleanId.toLowerCase()}_${req.ip}`;

    // Check if locked
    const lockout = checkLoginLockout(lockKey);
    if (lockout.locked) {
      res.status(429).json({
        success: false,
        locked: true,
        remainingSec: lockout.remainingSec,
        message: `Too many failed login attempts (10+). Account temporarily locked. Please try again after ${Math.ceil(lockout.remainingSec / 60)} minutes.`
      });
      return;
    }

    const queryOr: any[] = [
      { farmerId: cleanId.toUpperCase() },
      { username: cleanId },
      { phone: cleanId }
    ];

    if (last10Digits) {
      const flexiblePattern = last10Digits.split('').join('[\\s-]*');
      queryOr.push({ phone: { $regex: flexiblePattern, $options: 'i' } });
    }

    const farmer = await Farmer.findOne({ $or: queryOr });

    if (!farmer) {
      const fail = recordFailedAttempt(lockKey);
      const msg = fail.locked
        ? 'Too many failed login attempts (10+). Account locked for 15 minutes.'
        : fail.attemptsLeft <= 2
        ? `Invalid Farmer ID / Mobile Number or password. (Warning: Only ${fail.attemptsLeft} attempts remaining before 15-min lockout)`
        : 'Invalid Farmer ID / Mobile Number or password.';

      res.status(401).json({
        success: false,
        locked: fail.locked,
        remainingSec: fail.remainingSec,
        attemptsLeft: fail.attemptsLeft,
        message: msg
      });
      return;
    }

    if (farmer.status === 'SUSPENDED' || farmer.status === 'INACTIVE') {
      res.status(403).json({
        success: false,
        message: 'Your farmer portal account is suspended or inactive. Please contact Banshidhar Poultry.'
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, farmer.passwordHash);
    if (!isMatch) {
      const fail = recordFailedAttempt(lockKey);
      const msg = fail.locked
        ? 'Too many failed login attempts (10+). Account locked for 15 minutes.'
        : fail.attemptsLeft <= 2
        ? `Invalid Farmer ID / Mobile Number or password. (Warning: Only ${fail.attemptsLeft} attempts remaining before 15-min lockout)`
        : 'Invalid Farmer ID / Mobile Number or password.';

      res.status(401).json({
        success: false,
        locked: fail.locked,
        remainingSec: fail.remainingSec,
        attemptsLeft: fail.attemptsLeft,
        message: msg
      });
      return;
    }

    // Success -> Clear lock tracker
    clearFailedAttempts(lockKey);

    farmer.lastLogin = new Date();
    await farmer.save();

    const token = createJWT({
      userId: farmer._id.toString(),
      farmerId: farmer.farmerId,
      role: 'FARMER',
      username: farmer.username,
      name: farmer.name
    });

    await AuditLog.create({
      actorId: farmer._id.toString(),
      actorName: farmer.name,
      actorRole: 'FARMER',
      action: 'FARMER_LOGIN',
      entityType: 'Farmer',
      entityId: farmer._id.toString(),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      token,
      mustChangePassword: farmer.mustChangePassword,
      user: {
        id: farmer._id,
        farmerId: farmer.farmerId,
        username: farmer.username,
        name: farmer.name,
        phone: farmer.phone,
        email: farmer.email,
        farmName: farmer.farmName,
        village: farmer.village,
        district: farmer.district,
        mustChangePassword: farmer.mustChangePassword,
        role: 'FARMER'
      }
    });
  } catch (error: any) {
    logger.error('Auth', 'Farmer login error', error);
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
};

// Forgot Password Request (Valid for 15 minutes)
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role = 'ADMIN' } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    let user: any = null;

    if (role === 'ADMIN') {
      user = await Admin.findOne({ email: cleanEmail });
    } else {
      user = await Farmer.findOne({ email: cleanEmail });
    }

    if (!user) {
      // Do not expose if user exists for privacy
      res.json({
        success: true,
        message: 'If an account exists with this email, a 15-minute password reset link has been sent.'
      });
      return;
    }

    // Invalidate existing active tokens
    await PasswordResetToken.updateMany(
      { userId: user._id, isUsed: false },
      { isUsed: true }
    );

    const rawToken = generateRandomToken();
    const tokenHash = hashToken(rawToken);
    // 15 MINUTES EXPIRATION
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetToken.create({
      userId: user._id,
      userModel: role === 'ADMIN' ? 'Admin' : 'Farmer',
      email: cleanEmail,
      tokenHash,
      expiresAt,
      isUsed: false
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}&role=${role}`;

    const emailSent = await sendPasswordResetEmail(cleanEmail, user.name, resetUrl);

    if (!emailSent && process.env.NODE_ENV === 'production') {
      logger.error('Auth', 'Password reset email delivery failed in production');
      res.status(500).json({
        success: false,
        message: 'Unable to send password reset email. Please try again later or contact support.'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Password reset link has been sent to your email (Valid for 15 minutes).'
    });
  } catch (error: any) {
    logger.error('Auth', 'Forgot password error', error);
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
};

// Reset Password with Token
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword, role = 'ADMIN' } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Token and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }

    const tokenHash = hashToken(token);
    const resetRecord = await PasswordResetToken.findOne({
      tokenHash,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      res.status(400).json({ success: false, message: 'Invalid or expired password reset link (Links expire after 15 minutes).' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    if (resetRecord.userModel === 'Admin') {
      await Admin.findByIdAndUpdate(resetRecord.userId, { passwordHash });
    } else {
      await Farmer.findByIdAndUpdate(resetRecord.userId, {
        passwordHash,
        mustChangePassword: false
      });
    }

    resetRecord.isUsed = true;
    await resetRecord.save();

    // Invalidate all other reset tokens for this user
    await PasswordResetToken.updateMany(
      { userId: resetRecord.userId, _id: { $ne: resetRecord._id }, isUsed: false },
      { isUsed: true }
    );

    res.json({
      success: true,
      message: 'Your password has been successfully reset. Please log in with your new password.'
    });
  } catch (error: any) {
    logger.error('Auth', 'Reset password error', error);
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
};

// Change Password for Authenticated User (Only requires newPassword, no currentPassword needed)
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;
    const user = req.user;

    if (!user || !newPassword) {
      res.status(400).json({ success: false, message: 'New password is required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    if (user.role === 'ADMIN') {
      const admin = await Admin.findByIdAndUpdate(user.userId, { passwordHash }, { new: true });
      if (!admin) {
        res.status(404).json({ success: false, message: 'Admin not found.' });
        return;
      }
    } else {
      const farmer = await Farmer.findByIdAndUpdate(user.userId, { passwordHash, mustChangePassword: false }, { new: true });
      if (!farmer) {
        res.status(404).json({ success: false, message: 'Farmer not found.' });
        return;
      }
    }

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    logger.error('Auth', 'Change password error', error);
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
};

// Update Profile (Save/Change Registered Email & Phone)
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { email, phone, name } = req.body;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (user.role === 'ADMIN') {
      const admin = await Admin.findByIdAndUpdate(
        user.userId,
        {
          ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
          ...(phone !== undefined ? { phone: phone.trim() } : {}),
          ...(name !== undefined ? { name: name.trim() } : {})
        },
        { new: true }
      ).select('-passwordHash');

      res.json({ success: true, message: 'Admin profile & email updated successfully.', user: admin });
      return;
    } else {
      const farmer = await Farmer.findByIdAndUpdate(
        user.userId,
        {
          ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
          ...(phone !== undefined ? { phone: phone.trim() } : {}),
          ...(name !== undefined ? { name: name.trim() } : {})
        },
        { new: true }
      ).select('-passwordHash');

      res.json({ success: true, message: 'Farmer profile & email updated successfully.', user: farmer });
      return;
    }
  } catch (error: any) {
    logger.error('Auth', 'Update profile error', error);
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
};

// Get Current User Profile
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (user.role === 'ADMIN') {
      const admin = await Admin.findById(user.userId).select('-passwordHash');
      res.json({ success: true, user: admin, role: 'ADMIN' });
      return;
    }

    const farmer = await Farmer.findById(user.userId).select('-passwordHash');
    res.json({ success: true, user: farmer, role: 'FARMER' });
  } catch (error: any) {
    logger.error('Auth', 'Get profile error', error);
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
};
