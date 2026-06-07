import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
import { sendErr } from '../utils/http';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return sendErr(res, 'UNAUTHORIZED', 'No token provided', undefined, 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return sendErr(res, 'UNAUTHORIZED', 'Invalid token', undefined, 401);
  }
};

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
  } catch {}
  next();
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Admins bypass permission checks
    if (req.user?.role === 'admin') {
      return next();
    }

    if (!req.user?.permissions?.includes(permission)) {
      return sendErr(res, 'FORBIDDEN', `Missing required permission: ${permission}`, undefined, 403);
    }
    next();
  };
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendErr(res, 'FORBIDDEN', 'Insufficient permissions', undefined, 403);
    }
    next();
  };
};
