import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const registerHandler = async (req: Request, res: Response) => {
  console.log('[auth.controller]: Register attempt received.');
  console.log('[auth.controller]: Request body:', req.body);
  try {
    const { email, password, fullName } = req.body;
    
    const user = await authService.registerUser({ email, password, fullName });

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error: any) {
    if (error.message === 'Email already in use') {
      res.status(409).json({ message: error.message });
      return;
    }
    
    console.error('Error in registerHandler:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  console.log('[auth.controller]: Login attempt received.');
  console.log('[auth.controller]: Request body:', req.body);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('[auth.controller]: Login failed - Email or password missing.');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await authService.loginUser({ email, password });

    console.log(`[auth.controller]: User '${email}' logged in successfully.`);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[auth.controller]: Error during login process:', error);
    if (error.message === 'Invalid credentials') {
      res.status(401).json({ message: error.message });
      return;
    }
    
    console.error('Error in loginHandler:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

export const requestPasswordChangeHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const email = req.user!.email;

        await authService.generateAndSendPasswordResetToken(userId, email);

        res.status(200).json({ success: true, message: 'A security code has been sent to your email.' });
    } catch (error) {
        next(error);
    }
};

export const changePasswordHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Token and new password are required.' });
        }

        await authService.resetPasswordWithToken(userId, token, newPassword);

        res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (error: any) {
        if (error.message === 'Invalid or expired token' || error.message === 'User not found') {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
}; 

export const forgotPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }
        await authService.handleForgotPassword(email);
        res.status(200).json({ success: true, message: 'If an account with this email exists, a password reset code has been sent.' });
    } catch (error) {
        next(error);
    }
};

export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Token and new password are required.' });
        }
        await authService.resetPasswordWithPublicToken(token, newPassword);
        res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
    } catch (error: any) {
        if (error.message === 'Invalid or expired token') {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
}; 