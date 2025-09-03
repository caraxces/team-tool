import pool from '../../config/database';
import { generateUUID } from '../utils/uuid.util';
import { RowDataPacket } from 'mysql2';

export interface KnowledgeItem {
    id: number;
    uuid: string;
    title: string;
    link: string;
    description: string | null;
    status: 'pending' | 'done';
    createdAt: string;
    createdBy: {
        id: number;
        name: string;
    };
    assignee: {
        id: number;
        name: string;
    } | null;
}

export const getAllKnowledgeItems = async (user: { id: number; role_id: number }): Promise<KnowledgeItem[]> => {
    let query = `
        SELECT
            ki.id,
            ki.uuid,
            ki.title,
            ki.link,
            ki.description,
            ki.status,
            ki.created_at AS createdAt,
            creator.id AS createdById,
            creator.full_name AS createdByName,
            assignee.id AS assigneeId,
            assignee.full_name AS assigneeName
        FROM
            knowledge_items ki
        JOIN
            users creator ON ki.created_by_id = creator.id
        LEFT JOIN
            users assignee ON ki.assignee_id = assignee.id
    `;
    
    const queryParams: any[] = [];

    // If the user is not an admin (role_id != 1), filter by creator or assignee.
    if (user.role_id !== 1) {
        query += ` WHERE ki.created_by_id = ? OR ki.assignee_id = ?`;
        queryParams.push(user.id, user.id);
    }

    query += ` ORDER BY ki.created_at DESC;`;

    const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);

    return rows.map(row => ({
        id: row.id,
        uuid: row.uuid,
        title: row.title,
        link: row.link,
        description: row.description,
        status: row.status,
        createdAt: row.createdAt,
        createdBy: {
            id: row.createdById,
            name: row.createdByName,
        },
        assignee: row.assigneeId ? {
            id: row.assigneeId,
            name: row.assigneeName
        } : null
    }));
};

export const createKnowledgeItem = async (
    data: { title: string; link: string; description?: string; assigneeId?: number; }, 
    userId: number
): Promise<KnowledgeItem> => {
    const { title, link, description, assigneeId } = data;
    const uuid = generateUUID();

    const [result] = await pool.query(
        'INSERT INTO knowledge_items (uuid, title, link, description, created_by_id, assignee_id) VALUES (?, ?, ?, ?, ?, ?)',
        [uuid, title, link, description || null, userId, assigneeId || null]
    );

    const insertId = (result as any).insertId;
    
    // To return the full object, we can re-fetch it.
    // This is slightly inefficient but ensures consistency with getAllKnowledgeItems
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
            ki.id, ki.uuid, ki.title, ki.link, ki.description, ki.status, ki.created_at AS createdAt,
            creator.id AS createdById, creator.full_name AS createdByName,
            assignee.id AS assigneeId, assignee.full_name AS assigneeName
        FROM knowledge_items ki
        JOIN users creator ON ki.created_by_id = creator.id
        LEFT JOIN users assignee ON ki.assignee_id = assignee.id
        WHERE ki.id = ?
    `, [insertId]);

    const row = rows[0];
    return {
        id: row.id,
        uuid: row.uuid,
        title: row.title,
        link: row.link,
        description: row.description,
        status: row.status,
        createdAt: row.createdAt,
        createdBy: { id: row.createdById, name: row.createdByName },
        assignee: row.assigneeId ? { id: row.assigneeId, name: row.assigneeName } : null
    };
};

export const updateKnowledgeItemStatus = async (itemId: number, userId: number): Promise<KnowledgeItem> => {
    const [itemRows] = await pool.query<RowDataPacket[]>('SELECT assignee_id FROM knowledge_items WHERE id = ?', [itemId]);

    if (itemRows.length === 0) {
        throw new Error('Item not found');
    }

    const item = itemRows[0];
    if (item.assignee_id !== userId) {
        throw new Error('Only the assignee can mark this item as done.');
    }

    await pool.query('UPDATE knowledge_items SET status = ? WHERE id = ?', ['done', itemId]);

    // Re-fetch to return the updated item, ensuring consistency
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
            ki.id, ki.uuid, ki.title, ki.link, ki.description, ki.status, ki.created_at AS createdAt,
            creator.id AS createdById, creator.full_name AS createdByName,
            assignee.id AS assigneeId, assignee.full_name AS assigneeName
        FROM knowledge_items ki
        JOIN users creator ON ki.created_by_id = creator.id
        LEFT JOIN users assignee ON ki.assignee_id = assignee.id
        WHERE ki.id = ?
    `, [itemId]);
    
    const row = rows[0];
    return {
        id: row.id,
        uuid: row.uuid,
        title: row.title,
        link: row.link,
        description: row.description,
        status: row.status,
        createdAt: row.createdAt,
        createdBy: { id: row.createdById, name: row.createdByName },
        assignee: row.assigneeId ? { id: row.assigneeId, name: row.assigneeName } : null
    };
};

export const deleteKnowledgeItem = async (itemId: number, userId: number): Promise<void> => {
    const [itemRows] = await pool.query<RowDataPacket[]>('SELECT created_by_id FROM knowledge_items WHERE id = ?', [itemId]);

    if (itemRows.length === 0) {
        // We can choose to throw an error or just return silently
        // Throwing an error is more explicit.
        throw new Error('Item not found');
    }

    const item = itemRows[0];
    if (item.created_by_id !== userId) {
        throw new Error('Only the creator can delete this item.');
    }

    const [result] = await pool.query('DELETE FROM knowledge_items WHERE id = ?', [itemId]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
        throw new Error('Item not found or could not be deleted.');
    }
}; 