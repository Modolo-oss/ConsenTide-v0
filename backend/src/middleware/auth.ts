import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * JWT Authentication middleware
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'No token provided',
        timestamp: Date.now(),
      });
    }

    const token = authHeader.substring(7);
    const decoded = await authService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        timestamp: Date.now(),
      });
    }

    // Get user data
    const user = await authService.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
        timestamp: Date.now(),
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Authentication error',
      timestamp: Date.now(),
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: Date.now(),
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        timestamp: Date.now(),
      });
    }

    next();
  };
};

/**
 * Ownership check middleware - ensure user can only access their own resources
 */
export const requireOwnership = (paramName: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: Date.now(),
      });
    }

    const resourceId = req.params[paramName];
    if (req.user.id !== resourceId && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Access denied',
        timestamp: Date.now(),
      });
    }

    next();
  };
};
