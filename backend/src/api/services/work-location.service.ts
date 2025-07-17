import pool from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface WorkLocation {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius: number;
}

type WorkLocationData = Omit<WorkLocation, 'id'>;

export const getWorkLocations = async (): Promise<WorkLocation[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM work_locations ORDER BY name ASC');
    return rows as WorkLocation[];
};

export const createWorkLocation = async (data: WorkLocationData): Promise<WorkLocation> => {
    const { name, address, latitude, longitude, radius } = data;
    const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO work_locations (name, address, latitude, longitude, radius) VALUES (?, ?, ?, ?, ?)',
        [name, address, latitude, longitude, radius]
    );
    const insertId = result.insertId;
    const [newLocation] = await pool.query<RowDataPacket[]>('SELECT * FROM work_locations WHERE id = ?', [insertId]);
    return newLocation[0] as WorkLocation;
};

export const updateWorkLocation = async (id: number, data: Partial<WorkLocationData>): Promise<WorkLocation | null> => {
    // Build query dynamically based on provided fields
    const fields = Object.keys(data);
    const values = Object.values(data);
    if (fields.length === 0) {
        // Find and return the existing location if no data is provided for update
        const [existing] = await pool.query<RowDataPacket[]>('SELECT * FROM work_locations WHERE id = ?', [id]);
        return existing.length > 0 ? (existing[0] as WorkLocation) : null;
    }
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    await pool.query(`UPDATE work_locations SET ${setClause} WHERE id = ?`, [...values, id]);
    
    const [updatedLocation] = await pool.query<RowDataPacket[]>('SELECT * FROM work_locations WHERE id = ?', [id]);
    return updatedLocation.length > 0 ? (updatedLocation[0] as WorkLocation) : null;
};

export const deleteWorkLocation = async (id: number): Promise<boolean> => {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM work_locations WHERE id = ?', [id]);
    return result.affectedRows > 0;
}; 