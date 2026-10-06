import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Seller } from '../models/Seller';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required');

export interface SellerRequest extends Request {
  seller?: { id: string; email: string };
}

type Decoded = { id: string; email: string; type?: string };

export function signSellerToken(id: string, email: string): string {
  return jwt.sign({ id, email, type: 'seller' }, JWT_SECRET, { expiresIn: '7d' });
}

export async function sellerAuth(req: SellerRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  let decoded: Decoded;
  try {
    decoded = jwt.verify(header.slice(7), JWT_SECRET) as Decoded;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  if (decoded.type !== 'seller') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const seller = await Seller.findById(decoded.id).select('status email').lean();
  if (!seller) {
    res.status(401).json({ error: 'Seller account not found' });
    return;
  }
  if (seller.status !== 'active') {
    res.status(403).json({ error: 'Seller account is not active. Contact SNKRS CART.' });
    return;
  }
  req.seller = { id: decoded.id, email: seller.email };
  next();
}
