import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required');

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

type Decoded = { id: string; email: string; type?: string };

function candidateTokens(req: AuthRequest): string[] {
  const tokens: string[] = [];
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) tokens.push(authHeader.slice(7));
  if (req.cookies?.access_token) tokens.push(req.cookies.access_token);
  return tokens;
}

function verifyAny(tokens: string[]): Decoded | null {
  for (const token of tokens) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Decoded;
      if (decoded.type !== 'refresh') return decoded;
    } catch {
      continue;
    }
  }
  return null;
}

export function customerAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const tokens = candidateTokens(req);
  if (tokens.length === 0) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const decoded = verifyAny(tokens);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  req.user = { id: decoded.id, email: decoded.email };
  next();
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const decoded = verifyAny(candidateTokens(req));
  if (decoded) req.user = { id: decoded.id, email: decoded.email };
  next();
}
