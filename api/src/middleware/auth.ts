import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { JWT_SECRET, JwtPayload } from '../config/jwt';
import { AppError } from '../utils/http';

const jwtPayloadSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string(),
  permissions: z.array(z.string()).optional(),
});

function parseToken(token: string | undefined): JwtPayload {
  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'No token provided');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET());
    return jwtPayloadSchema.parse(decoded);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof z.ZodError) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid token payload');
    }
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
  }
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  req.user = parseToken(token);
  next();
};

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();

  try {
    req.user = parseToken(token);
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'admin') {
      return next();
    }
    if (!req.user?.permissions?.includes(permission)) {
      throw new AppError(403, 'FORBIDDEN', `Missing required permission: ${permission}`);
    }
    next();
  };
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }
    next();
  };
};
