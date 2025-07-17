import pool from '../../config/database';
import { RowDataPacket } from 'mysql2';
import { User } from '../../types/user.types';

export const findUserByEmail = async (email: string): Promise<User | null> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, uuid, email, full_name AS fullName, role_id, avatar_url AS avatarUrl FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
        return rows[0] as User;
    }
    return null;
};

export const findUserByUuid = async (uuid: string): Promise<User | null> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, uuid, email, full_name AS fullName, role_id, avatar_url AS avatarUrl FROM users WHERE uuid = ?', [uuid]);
    if (rows.length > 0) {
        return rows[0] as User;
    }
    return null;
};

export const findUserById = async (id: number): Promise<User | null> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, uuid, email, full_name AS fullName, role_id, avatar_url AS avatarUrl FROM users WHERE id = ?', [id]);
    if (rows.length > 0) {
        return rows[0] as User;
    }
    return null;
};

export const createUser = async (userData: Omit<User, 'id' | 'role_id'> & { passwordHash: string }) => {
    // ... existing code
};

export const getAllUsers = async (): Promise<User[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, uuid, email, full_name AS fullName, role_id, avatar_url AS avatarUrl FROM users ORDER BY fullName ASC');
    return rows as User[];
};

export const updateUserRole = async (userId: number, roleId: number) => {
    const [result] = await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, userId]);
    // @ts-ignore
    if (result.affectedRows === 0) {
        throw new Error('User not found');
    }
};

export const updateMyProfile = async (userId: number, data: { fullName: string }) => {
    const { fullName } = data;
    const [result] = await pool.query(
        'UPDATE users SET full_name = ? WHERE id = ?',
        [fullName, userId]
    );
    // @ts-ignore
    if (result.affectedRows === 0) {
        throw new Error('User not found');
    }
};

export const getUsersByProjectId = async (projectId: number): Promise<any[]> => {
    const query = `
        SELECT u.id, u.uuid, u.email, u.full_name AS fullName, u.avatar_url AS avatarUrl
        FROM users u
        JOIN project_members pm ON u.id = pm.user_id
        WHERE pm.project_id = ?
    `;
    const [rows] = await pool.query(query, [projectId]);
    return rows as any[];
};

export const updateAvatar = async (userId: number, avatarPath: string) => {
    const [result] = await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarPath, userId]);
    // @ts-ignore
    if (result.affectedRows === 0) {
        throw new Error('User not found or avatar not updated');
    }
    return avatarPath;
}; 