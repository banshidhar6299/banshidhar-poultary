import rateLimit from 'express-rate-limit';

/**
 * Separate rate limiters for different endpoint categories.
 * Uses in-memory store (document single-instance limitation for Render free tier).
 */

/** Login attempts: 10 per 15 min per IP */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

/** Password reset requests: 5 per 15 min per IP */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests. Please try again later.' }
});

/** Join requests: 5 per hour per IP */
export const joinRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many join requests. Please try again later.' }
});

/** AI chat: 20 per 15 min per IP */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'AI assistant rate limit reached. Please wait before sending more messages.' }
});

/** File uploads: 30 per 15 min per IP */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many upload requests. Please try again later.' }
});

/** General API: 1000 per 15 min per IP */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});
