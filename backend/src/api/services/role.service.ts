import pool from '../../config/database';
import { RowDataPacket } from 'mysql2';

export interface Role {
    id: number;
    name: string;
}

export const getRoles = async (): Promise<Role[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name FROM roles');
    return rows as Role[];
}; 