import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuthPayload } from '../types';
import { verifyJWT } from '../utils/helpers';

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const decoded = verifyJWT(token);
  if (!decoded) {
    res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    return;
  }

  req.user = decoded;
  next();
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Access denied. Admin authorization required.' });
    return;
  }
  next();
};

export const requireFarmer = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'FARMER') {
    res.status(403).json({ success: false, message: 'Access denied. Farmer authorization required.' });
    return;
  }
  next();
};

export const requireAdminOrFarmerOwner = (farmerIdParamKey = 'farmerId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const targetFarmerId = req.params[farmerIdParamKey] || req.query[farmerIdParamKey] || req.body[farmerIdParamKey];
    if (req.user.role === 'FARMER') {
      // Compare with req.user.userId or req.user.farmerId
      if (
        targetFarmerId &&
        targetFarmerId !== req.user.userId &&
        targetFarmerId !== req.user.farmerId
      ) {
        res.status(403).json({
          success: false,
          message: 'Access forbidden: You cannot access another farmer’s records.'
        });
        return;
      }
      next();
      return;
    }

    res.status(403).json({ success: false, message: 'Access forbidden.' });
  };
};
