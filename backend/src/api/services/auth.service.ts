import pool from '../../config/database';
import { RowDataPacket } from 'mysql2';
import { findUserByEmail } from './user.service';
import { hashPassword, verifyPassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';
import { generateUUID } from '../utils/uuid.util';
import { sendEmail } from '../../config/mailer';
import { NewUserInput, User } from '../../types/user.types';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const DEFAULT_MEMBER_ROLE_ID = 3;

// A quick utility to check if an email exists
const emailExists = async (email: string): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
  return rows.length > 0;
};

export const registerUser = async (userData: any) => {
    // 1. Destructure with the expected camelCase from the controller/frontend
    const { email, password, fullName } = userData;

    // 2. Robust check for the input
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
        throw new Error('Full name is required and must be a non-empty string');
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const userUUID = generateUUID();

    // 3. Create the object for the database using snake_case
    const newUserInput: NewUserInput = {
        uuid: userUUID,
        email,
        password: passwordHash,
        full_name: fullName, // Correct mapping from camelCase to snake_case
        role_id: 1, // TEMPORARY: Assign Admin role for first user registration
    };

    // 4. Use the correct snake_case column name in the SQL query
    await pool.query(
        'INSERT INTO users (uuid, email, password, full_name, role_id) VALUES (?, ?, ?, ?, ?)',
        [newUserInput.uuid, newUserInput.email, newUserInput.password, newUserInput.full_name, newUserInput.role_id]
    );

    const createdUser = await findUserByEmail(email);
    if (!createdUser) {
        throw new Error('Failed to retrieve created user');
    }

    const token = generateToken({ uuid: createdUser.uuid, email: createdUser.email, role_id: createdUser.role_id });

    return {
        token,
        user: createdUser
    };
};

export const loginUser = async (credentials: any) => {
  const { email, password } = credentials;

  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
  
  if (rows.length === 0) {
    throw new Error('Invalid credentials');
  }
  
  const user = rows[0];
  
  const isPasswordValid = await verifyPassword(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Pass the correct user properties to the token
  const token = generateToken({ uuid: user.uuid, email: user.email, role_id: user.role_id });

  return {
    token,
    user: {
      uuid: user.uuid,
      email: user.email,
      fullName: user.full_name,
    }
  };
}; 

export const generateAndSendPasswordResetToken = async (userId: number, email: string) => {
    const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    const hashedToken = await bcrypt.hash(resetToken, 10);

    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
    await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, hashedToken, expires]
    );

    await sendEmail({
        from: '"Team Tool" <noreply@teamtool.com>',
        to: email,
        subject: 'Your Password Reset Code',
        text: `Your password reset code is: ${resetToken}. It will expire in 10 minutes.`,
        html: `<b>Your password reset code is: ${resetToken}</b><p>It will expire in 10 minutes.</p>`,
    });
};

export const resetPasswordWithToken = async (userId: number, token: string, newPassword: string) => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM password_reset_tokens WHERE user_id = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [userId]
    );

    if (rows.length === 0) {
        throw new Error('Invalid or expired token');
    }

    const dbToken = rows[0];
    const isValid = await bcrypt.compare(token, dbToken.token);

    if (!isValid) {
        throw new Error('Invalid or expired token');
    }

    const newPasswordHash = await hashPassword(newPassword);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPasswordHash, userId]);
    await pool.query('DELETE FROM password_reset_tokens WHERE id = ?', [dbToken.id]);
}; 

export const handleForgotPassword = async (email: string) => {
    const user = await findUserByEmail(email);
    // If user does not exist, we do nothing to prevent email enumeration.
    // The controller will send a generic success message.
    if (user) {
        // We can reuse the same token generation logic
        await generateAndSendPasswordResetToken(user.id, user.email);
    }
};


export const resetPasswordWithPublicToken = async (token: string, newPassword: string) => {
    // This logic needs to be different because we don't have the user ID.
    // We must find the token first, then get the user ID from it.

    const [tokenRows] = await pool.query<RowDataPacket[]>('SELECT * FROM password_reset_tokens WHERE expires_at > NOW()');
    
    let dbToken: any = null;
    let userId: number | null = null;

    // We must iterate and compare in code to prevent timing attacks.
    for (const row of tokenRows) {
        const isValid = await bcrypt.compare(token, row.token);
        if (isValid) {
            dbToken = row;
            userId = row.user_id;
            break;
        }
    }

    if (!dbToken || !userId) {
        throw new Error('Invalid or expired token');
    }

    const newPasswordHash = await hashPassword(newPassword);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPasswordHash, userId]);
    await pool.query('DELETE FROM password_reset_tokens WHERE id = ?', [dbToken.id]);
}; 