import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User';
import { isMockAuthEnabled, mockUserProfile } from '../config/mockUser';

export interface AuthRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: 'user' | 'admin';
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (isMockAuthEnabled) {
      req.user = {
        user_id: decoded.user_id ?? mockUserProfile.user_id,
        email: decoded.email ?? mockUserProfile.email,
        role: decoded.role === 'admin' ? 'admin' : mockUserProfile.role,
      };

      return next();
    }

    // Verify user still exists
    const user = await UserModel.findById(decoded.user_id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      user_id: user.user_id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

export const generateToken = (user: { user_id: number; email: string; role: 'user' | 'admin' }): string => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
};
