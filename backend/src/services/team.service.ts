import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Định nghĩa kiểu dữ liệu cho thành viên team, chỉ lấy các trường cần thiết
export interface TeamMember extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

export interface Team extends RowDataPacket {
    id: number;
    uuid: string;
    name: string;
    description?: string;
    created_by: number;
}

/**
 * Lấy danh sách thành viên của một team.
 * @param teamId - ID của team
 * @returns Danh sách các user là thành viên
 */
export const getTeamMembers = async (teamId: number): Promise<TeamMember[]> => {
    const [rows] = await pool.query<TeamMember[]>(`
        SELECT u.id, u.full_name as name, u.email, u.avatar_url as avatar FROM users u
        INNER JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.team_id = ?
    `, [teamId]);
    return rows;
};

/**
 * Mời một user vào team.
 * @param teamId - ID của team
 * @param userId - ID của user được mời
 * @returns Thông tin thành viên vừa được thêm
 */
export const inviteUserToTeam = async (teamId: number, userId: number) => {
    // Optional: Check if user is already in the team
    const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
        [teamId, userId]
    );
    if (existing.length > 0) {
        throw new Error('User is already in this team.');
    }

    await pool.query(
        `INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)`,
        [teamId, userId, 'member'] // Default role is 'member'
    );
    
    return { teamId, userId };
};

/**
 * Lấy tất cả các team mà một user là thành viên.
 * @param userId - ID của user
 * @returns Danh sách các team
 */
export const getTeamsByUserId = async (userId: number): Promise<Team[]> => {
    const [rows] = await pool.query<Team[]>(`
        SELECT t.* FROM teams t
        INNER JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ?
    `, [userId]);
    return rows;
};

/**
 * Tạo một team mới và tự động thêm người tạo vào làm thành viên.
 * @param name - Tên của team
 * @param description - Mô tả của team
 * @param creatorId - ID của người tạo
 * @returns Team vừa được tạo
 */
export const createTeam = async (name: string, description: string | null, creatorId: number): Promise<Team> => {
    const teamUuid = uuidv4();
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const [result] = await connection.query<ResultSetHeader>(`
            INSERT INTO teams (uuid, name, description, created_by)
            VALUES (?, ?, ?, ?)
        `, [teamUuid, name, description, creatorId]);
        
        const newTeamId = result.insertId;

        await connection.query(`
            INSERT INTO team_members (team_id, user_id, role)
            VALUES (?, ?, 'owner')
        `, [newTeamId, creatorId]);

        await connection.commit();

        const [teamRows] = await connection.query<Team[]>('SELECT * FROM teams WHERE id = ?', [newTeamId]);
        
        return teamRows[0];
    } catch (error) {
        await connection.rollback();
        console.error('Failed to create team:', error);
        throw new Error('Could not create team.');
    } finally {
        connection.release();
    }
}; 