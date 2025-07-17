import pool from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { createTeamAddedNotification } from './notification.service';

export const getTeamsByUserId = async (userId: number) => {
    const [teams] = await pool.query(`
        SELECT t.id, t.uuid, t.name, t.description, t.created_at
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ?
    `, [userId]);
    return teams;
};

export const createTeam = async (name: string, description: string | null, userId: number) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const teamUuid = uuidv4();
        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO teams (uuid, name, description, created_by) VALUES (?, ?, ?, ?)',
            [teamUuid, name, description || null, userId]
        );
        const newTeamId = result.insertId;

        await connection.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            [newTeamId, userId, 'admin']
        );
        
        await connection.commit();

        const [newTeam] = await connection.query('SELECT id, uuid, name, description, created_at FROM teams WHERE id = ?', [newTeamId]);
        return (newTeam as any)[0];
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const getTeamMembers = async (teamId: number) => {
    const [members] = await pool.query(`
        SELECT u.id, u.uuid, u.full_name AS fullName, u.email, u.avatar_url AS avatarUrl
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.team_id = ?
    `, [teamId]);
    return members;
};

export const inviteMemberToTeam = async (teamId: number, userId: number, invitedBy?: number) => {
    try {
        await pool.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            [teamId, userId, 'member']
        );
        
        // Create notification for the added member
        if (invitedBy && invitedBy !== userId) {
            try {
                // Get team name for notification
                const [teamRows] = await pool.query<RowDataPacket[]>(
                    'SELECT name FROM teams WHERE id = ?',
                    [teamId]
                );
                
                if (teamRows.length > 0) {
                    const teamName = teamRows[0].name;
                    await createTeamAddedNotification(invitedBy, [userId], teamId, teamName);
                }
            } catch (notificationError) {
                console.error('Failed to create team invitation notification:', notificationError);
            }
        }
        
        return { success: true };
    } catch (error) {
        if ((error as any).code === 'ER_DUP_ENTRY') {
            throw new Error('User is already in the team.');
        }
        throw error;
    }
};

interface CsvImportResult {
    successful: number;
    failed: number;
    errors: { row: number, reason: string }[];
}

export const importMembersFromCsv = async (fileContent: string, teamId: number): Promise<CsvImportResult> => {
     return new Promise((resolve, reject) => {
        const results: any[] = [];
        const errors: { row: number, reason: string }[] = [];
        let successful = 0;
        let failed = 0;
        let rowIndex = 1;

        Readable.from(fileContent).pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                const connection = await pool.getConnection();
                for (const row of results) {
                    rowIndex++;
                    const { email } = row;
                    if (!email) {
                        errors.push({ row: rowIndex, reason: 'Missing required field: email.' });
                        failed++;
                        continue;
                    }
                    try {
                        const [userRows] = await connection.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
                        if (userRows.length === 0) {
                            throw new Error(`User with email '${email}' not found.`);
                        }
                        const userId = userRows[0].id;

                        // Use a transaction for each insert to handle duplicate errors gracefully
                        await connection.beginTransaction();
                        await connection.query('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [teamId, userId, 'member']);
                        await connection.commit();
                        successful++;
                    } catch (err: any) {
                        await connection.rollback();
                        if (err.code !== 'ER_DUP_ENTRY') {
                            errors.push({ row: rowIndex, reason: err.message });
                        }
                        failed++;
                    }
                }
                connection.release();
                resolve({ successful, failed, errors });
            })
            .on('error', (err) => reject(err));
    });
} 