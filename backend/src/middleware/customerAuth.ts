import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'snkrs-cart-jwt-s3cr3t-k3y-2026';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

/** Requires valid access token — rejects with 401 if missing/invalid */
export function customerAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Attaches user if token present, but does NOT reject — for optional auth routes */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token;
  if (!token) { next(); return; }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
  } catch {
    // Token invalid — proceed without user
  }
  next();
}
