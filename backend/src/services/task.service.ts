import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const createTask = async (taskData: any, creatorId: number) => {
    const { title, description, assigneeId, priority, dueDate, projectId } = taskData;
    const [result] = await pool.query(
        `INSERT INTO tasks (uuid, title, description, status, priority, due_date, project_id, reporter_id, assignee_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            uuidv4(),
            title,
            description || null,
            'todo',
            priority || 'medium',
            dueDate || null,
            projectId,
            creatorId,
            assigneeId || null
        ]
    );
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [(result as any).insertId]) as any[];
    return rows[0];
};

export const getTasksByProjectId = async (projectId: string): Promise<any[]> => {
    const [rows] = await pool.query(
        `SELECT 
            t.id, t.uuid, t.title, t.description, t.status, t.priority, t.due_date, t.project_id,
            u.name as assignee_name, u.avatar as assignee_avatar
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE t.project_id = ? AND t.parent_task_id IS NULL
        ORDER BY t.created_at DESC`,
        [projectId]
    );
    return rows as any[];
};

export const updateTaskStatus = async (taskId: string, status: string): Promise<any> => {
    const [result] = await pool.query(
        'UPDATE tasks SET status = ? WHERE uuid = ?',
        [status, taskId]
    );
    
    if ((result as any).affectedRows === 0) {
        throw new Error('Task not found');
    }
    
    const [rows] = await pool.query('SELECT * FROM tasks WHERE uuid = ?', [taskId]) as any[];
    return rows[0];
};

export const getMyTasks = async (userId: number): Promise<any[]> => {
    const [rows] = await pool.query(
        `
        SELECT 
            t.id, t.uuid, t.title, t.description, t.status, t.priority, t.due_date, t.project_id,
            p.name as project_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE t.assignee_id = ? 
        AND t.parent_task_id IS NULL
        ORDER BY 
            CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, 
            t.due_date ASC, 
            t.created_at DESC
        `,
        [userId]
    );

    const tasks = rows as any[];
    // You could expand this to also fetch sub-tasks if needed by the widget
    return tasks;
}; 