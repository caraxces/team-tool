import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { createTaskAssignedNotification } from './notification.service';

export interface Task {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  assignee: {
    id: number;
    name: string;
    avatar: string | null;
  } | null;
  subtasks: Task[];
}

export const getTasksByProjectId = async (projectId: number): Promise<Task[]> => {
  const query = `
    SELECT
      t.id, t.uuid, t.title, t.description, t.status, t.priority,
      t.due_date AS dueDate,
      u.id AS assigneeId, u.full_name AS assigneeName, u.avatar_url AS assigneeAvatar,
      (SELECT
        CAST(CONCAT('[', GROUP_CONCAT(JSON_OBJECT('id', st.id, 'title', st.title, 'status', st.status)), ']') AS JSON)
        FROM tasks st WHERE st.parent_task_id = t.id
      ) as subtasks
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.project_id = ? AND t.parent_task_id IS NULL
    ORDER BY t.created_at ASC;
  `;
  const [rows] = await pool.query<RowDataPacket[]>(query, [projectId]);

  return rows.map(row => ({
    id: row.id,
    uuid: row.uuid,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate,
    assignee: row.assigneeId ? {
      id: row.assigneeId,
      name: row.assigneeName,
      avatar: row.assigneeAvatar,
    } : null,
    subtasks: row.subtasks || [],
  }));
};

export const createTask = async (data: any, createdBy: number): Promise<any> => {
    const { projectId, parentTaskId, title, description, status, priority, assigneeId, dueDate } = data;
    const taskUUID = uuidv4();

    // Validate và format due_date
    let formattedDueDate = null;
    if (dueDate && dueDate !== '11111-11-11' && dueDate !== '') {
        const dateObj = new Date(dueDate);
        if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
            formattedDueDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
    }

    const [result] = await pool.query(
        'INSERT INTO tasks (uuid, project_id, parent_task_id, title, description, status, priority, assignee_id, reporter_id, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            taskUUID, 
            projectId, 
            parentTaskId || null, 
            title, 
            description || null, 
            status || 'todo', 
            priority || 'medium', 
            assigneeId || null, 
            createdBy, 
            formattedDueDate
        ]
    );
    const insertId = (result as any).insertId;
    
    const query = `
      SELECT
        t.id, t.uuid, t.title, t.description, t.status, t.priority,
        t.due_date AS dueDate,
        u.id AS assigneeId, u.full_name AS assigneeName, u.avatar_url AS assigneeAvatar
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [insertId]);
    const row = rows[0];

    const newTask = {
        id: row.id,
        uuid: row.uuid,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        dueDate: row.dueDate,
        assignee: row.assigneeId ? {
          id: row.assigneeId,
          name: row.assigneeName,
          avatar: row.assigneeAvatar,
        } : null,
        subtasks: [], // A new task won't have subtasks initially
    };

    // Create notification if task is assigned to someone
    if (assigneeId && assigneeId !== createdBy) {
        try {
            await createTaskAssignedNotification(createdBy, [assigneeId], row.id, title);
        } catch (notificationError) {
            console.error('Failed to create task assignment notification:', notificationError);
        }
    }

    return newTask;
};

export const updateTask = async (taskId: number, data: any, updatedBy?: number): Promise<any> => {
    // This is a simplified update. A more robust version would build the SET clause dynamically.
    const { title, description, status, priority, assigneeId, dueDate } = data;
    
    // Validate và format due_date
    let formattedDueDate = dueDate;
    if (dueDate && dueDate !== '11111-11-11' && dueDate !== '') {
        const dateObj = new Date(dueDate);
        if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
            formattedDueDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
        } else {
            formattedDueDate = null; // Invalid date
        }
    } else if (dueDate === '11111-11-11' || dueDate === '') {
        formattedDueDate = null;
    }
    
    // Get current task data to check if assignee changed
    const [currentTaskRows] = await pool.query<RowDataPacket[]>(
        'SELECT assignee_id, title FROM tasks WHERE id = ?', 
        [taskId]
    );
    const currentTask = currentTaskRows[0];
    const previousAssigneeId = currentTask?.assignee_id;
    
    await pool.query(
        'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, due_date = ? WHERE id = ?',
        [title, description, status, priority, assigneeId, formattedDueDate, taskId]
    );
     const [rows] = await pool.query<RowDataPacket[]>('SELECT id, uuid, title, status FROM tasks WHERE id = ?', [taskId]);
    
    // Create notification if assignee changed and task is assigned to someone new
    if (assigneeId && assigneeId !== previousAssigneeId && updatedBy && assigneeId !== updatedBy) {
        try {
            await createTaskAssignedNotification(updatedBy, [assigneeId], taskId, title || currentTask.title);
        } catch (notificationError) {
            console.error('Failed to create task assignment notification:', notificationError);
        }
    }
    
    return rows[0];
};

export const updateTaskStatus = async (taskId: number, status: string): Promise<any> => {
    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, status FROM tasks WHERE id = ?', [taskId]);
    return rows[0];
};

export const deleteTask = async (taskId: number, userId: number): Promise<boolean> => {
    try {
        const [result] = await pool.query<ResultSetHeader>('DELETE FROM tasks WHERE id = ?', [taskId]);
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error(`Could not delete task: ${error}`);
    }
};

export const getAllTasks = async () => {
    const [rows] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return rows;
};

export const getMyTasks = async (userId: number) => {
  const query = `
    SELECT
      t.id, t.uuid, t.title, t.description, t.status, t.priority, t.due_date,
      p.name as project_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.assignee_id = ? AND t.parent_task_id IS NULL
    ORDER BY
      CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
      t.due_date ASC,
      t.created_at DESC
  `;
  const [tasks] = await pool.query(query, [userId]);
  return tasks;
}; 

interface CsvImportResult {
    successful: number;
    failed: number;
    errors: { row: number, reason: string }[];
}

// Helper to get project and assignee IDs
const getIdsFromUuidsAndEmails = async (projectUuid: string, assigneeEmail?: string | null) => {
    const [projectRows] = await pool.query<RowDataPacket[]>('SELECT id FROM projects WHERE uuid = ?', [projectUuid]);
    const projectId = projectRows.length > 0 ? projectRows[0].id : null;

    let assigneeId = null;
    if (assigneeEmail) {
        const [userRows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [assigneeEmail]);
        assigneeId = userRows.length > 0 ? userRows[0].id : null;
    }

    return { projectId, assigneeId };
};


export const importTasksFromCsv = async (fileContent: string, reporterId: number): Promise<CsvImportResult> => {
    return new Promise(async (resolve, reject) => {
        const results: any[] = [];
        const errors: { row: number, reason: string }[] = [];
        let successful = 0;
        let failed = 0;
        let rowIndex = 1;

        const stream = Readable.from(fileContent);

        stream.pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                const connection = await pool.getConnection();
                
                for (const row of results) {
                    rowIndex++;
                    const { title, description, project_uuid, assignee_email, due_date, priority, status } = row;
                    
                    if (!title || !project_uuid) {
                        errors.push({ row: rowIndex, reason: 'Missing required fields: title and project_uuid.' });
                        failed++;
                        continue;
                    }

                    try {
                        await connection.beginTransaction();

                        const { projectId, assigneeId } = await getIdsFromUuidsAndEmails(project_uuid, assignee_email);

                        if (!projectId) {
                            throw new Error(`Project with UUID '${project_uuid}' not found.`);
                        }
                        if (assignee_email && !assigneeId) {
                            throw new Error(`Assignee with email '${assignee_email}' not found.`);
                        }

                        const taskUuid = uuidv4();
                        await connection.query(
                            `INSERT INTO tasks (uuid, title, description, project_id, assignee_id, reporter_id, due_date, priority, status)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [taskUuid, title, description || null, projectId, assigneeId, reporterId, due_date || null, priority || 'medium', status || 'todo']
                        );
                        
                        await connection.commit();
                        successful++;
                    } catch (err: any) {
                        await connection.rollback();
                        errors.push({ row: rowIndex, reason: err.message });
                        failed++;
                    }
                }
                
                connection.release();
                resolve({ successful, failed, errors });
            })
            .on('error', (err) => {
                reject(err);
            });
    });
};

export const getTaskStatsForUser = async (userId: number) => {
    const query = `
        SELECT
            COUNT(*) AS totalTasks,
            SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS completedTasks
        FROM tasks
        WHERE assignee_id = ?;
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [userId]);
    const stats = rows[0];

    const totalTasks = Number(stats.totalTasks) || 0;
    const completedTasks = Number(stats.completedTasks) || 0;
    const pendingTasks = totalTasks - completedTasks;

    return {
        totalTasks,
        completedTasks,
        pendingTasks,
        overallProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
}; 