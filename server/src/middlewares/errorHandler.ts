import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('ErrorHandler', 'Unhandled error', err);

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Multer file size / type errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      success: false,
      message: 'File too large. Please upload a smaller file.'
    });
    return;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
    res.status(400).json({
      success: false,
      message: 'Invalid file upload. Check file count and field names.'
    });
    return;
  }

  // CORS errors
  if (err.message?.includes('Origin not allowed')) {
    res.status(403).json({
      success: false,
      message: 'Origin not allowed.'
    });
    return;
  }

  // In production, never expose internal error details
  const message = isProduction
    ? (statusCode === 500 ? 'An internal error occurred. Please try again later.' : err.message || 'Request failed.')
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: err.stack })
  });
};
