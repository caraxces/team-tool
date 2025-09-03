import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { findUserByUuid } from '../services/user.service';
import { User } from '../../types/user.types';

// Extend the Express Request interface to include the user payload
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;

  if (!bearer || !bearer.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const [, token] = bearer.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token format' });
  }

  try {
    const decodedPayload = verifyToken(token);
    if (!decodedPayload || !decodedPayload.uuid) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token payload' });
    }
    
    const currentUser = await findUserByUuid(decodedPayload.uuid);

    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
    
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

export const adminOnly = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role_id !== 1) { // Assuming 'admin' role has ID 1
    return res.status(403).json({ message: 'Forbidden: Access denied. Requires admin privileges.' });
  }
  next();
};

export const hrAndHrmOnly = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userRoleId = req.user?.role_id;
  if (!userRoleId || ![4, 5].includes(userRoleId)) {
    return res.status(403).json({ message: 'Forbidden: Access denied. Requires HR or HRM privileges.' });
  }
  next();
}; 