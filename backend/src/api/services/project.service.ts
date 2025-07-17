import pool from '../../config/database';
import { generateUUID } from '../utils/uuid.util';
import { RowDataPacket } from 'mysql2';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { ProjectDetails, ProjectKeyword } from '../../types/project.types';
import { createProjectAssignedNotification } from './notification.service';

function formatToMySQLDatetime(date: Date | string | undefined): string | null {
    if (!date) return null;
    try {
        const d = new Date(date);
        // Pad numbers to 2 digits
        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch (e) {
        return null; // Return null if date is invalid
    }
}


// This interface matches the data structure from the complex query
interface ProjectFromDB extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  deadline: string;
  total_tasks: number;
  completed_tasks: number;
  pic_id: number | null;
  pic_name: string | null;
  pic_avatar: string | null;
  // This will now be a JSON array string from the database, handled carefully
  members_json: string | null;
}

// This is the shape of data we want to send to the frontend
// It MUST match what the frontend components expect
export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'Completed' | 'On Track' | 'At Risk' | 'Planning';
  progress: number;
  deadline: string;
  pic: {
      id: number;
      name: string;
      avatar: string | null;
  } | null;
  members: {
      id: number;
      name: string;
      avatar: string | null;
  }[];
}

const mapStatus = (status: ProjectFromDB['status']): Project['status'] => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'On Track';
    case 'on_hold':
      return 'At Risk';
    case 'planning':
      return 'Planning';
    default:
      return 'On Track';
  }
};

const getProjectById = async (projectId: number): Promise<Project | null> => {
    const query = `
    SELECT
      p.id,
      p.name,
      p.description,
      p.status,
      p.end_date as deadline,
      p.pic_id,
      pic.full_name AS pic_name,
      pic.avatar_url AS pic_avatar,
      (SELECT COUNT(t.id) FROM tasks t WHERE t.project_id = p.id) AS total_tasks,
      (SELECT COUNT(t.id) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS completed_tasks,
      COALESCE(
        (SELECT
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', mem.id,
              'name', mem.full_name,
              'avatar', mem.avatar_url
            )
          )
        FROM project_members pm
        JOIN users mem ON pm.user_id = mem.id
        WHERE pm.project_id = p.id),
      '[]') AS members_json
    FROM
      projects p
    LEFT JOIN
      users pic ON p.pic_id = pic.id
    WHERE p.id = ?
    GROUP BY
      p.id;
  `;

  const [rows] = await pool.query<ProjectFromDB[]>(query, [projectId]);

  if (rows.length === 0) {
    return null;
  }
  
  const p = rows[0];
  const progress = p.total_tasks > 0 ? Math.round((p.completed_tasks / p.total_tasks) * 100) : 0;
    
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    status: mapStatus(p.status),
    progress: progress,
    deadline: p.deadline,
    pic: p.pic_id ? { id: p.pic_id, name: p.pic_name || 'N/A', avatar: p.pic_avatar } : null,
    members: JSON.parse(p.members_json || '[]'),
  };
}

export const getProjectDetailsByProjectId = async (projectId: number): Promise<ProjectDetails | null> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM project_details WHERE project_id = ?',
        [projectId]
    );

    if (rows.length === 0) {
        return null;
    }
    
    // MySQL JSON columns are returned as strings, so we need to parse them.
    const details = rows[0] as any;
    if (details.keywords_plan && typeof details.keywords_plan === 'string') {
        details.keywords_plan = JSON.parse(details.keywords_plan);
    }

    return details as ProjectDetails;
};

export const createOrUpdateProjectDetails = async (projectId: number, details: Partial<Omit<ProjectDetails, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): Promise<ProjectDetails> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // --- Data Sanitization ---
        const dataToSave: { [key: string]: any } = { ...details };

        // Sanitize numeric fields: convert any "falsy" value (except 0) to null
        const numericFields: (keyof ProjectDetails)[] = ['personnel_count', 'website_page_count'];
        numericFields.forEach(field => {
            if (dataToSave[field] === '' || dataToSave[field] === null || typeof dataToSave[field] === 'undefined') {
                dataToSave[field] = null;
            }
        });

        // Sanitize keywords_plan and remove raw field
        if (dataToSave.keywords_plan && Array.isArray(dataToSave.keywords_plan)) {
            dataToSave.keywords_plan = JSON.stringify(
                dataToSave.keywords_plan.map((plan: any) => {
                    const { subKeywordsRaw, ...rest } = plan; // remove subKeywordsRaw
                    return rest;
                })
            );
        } else if (details.hasOwnProperty('keywords_plan')) {
            dataToSave.keywords_plan = null; // Ensure it's set to null if provided but empty
        }
        
        // Remove id and project_id from data to prevent trying to update them
        delete dataToSave.id;
        delete dataToSave.project_id;
        
        // Format date fields before saving
        if (dataToSave.created_at) {
            dataToSave.created_at = formatToMySQLDatetime(dataToSave.created_at);
        }
         if (dataToSave.updated_at) {
            dataToSave.updated_at = formatToMySQLDatetime(dataToSave.updated_at);
        }


        // --- Database Operation ---
        const [existingRows] = await connection.query<RowDataPacket[]>('SELECT id FROM project_details WHERE project_id = ?', [projectId]);

        if (existingRows.length > 0) {
            // UPDATE: Only update if there's actually data to update
            if (Object.keys(dataToSave).length > 0) {
                const setClause = Object.keys(dataToSave).map(key => `\`${key}\` = ?`).join(', ');
                const values = [...Object.values(dataToSave), projectId];
                await connection.query(`UPDATE project_details SET ${setClause} WHERE project_id = ?`, values);
            }
        } else {
            // INSERT: Add project_id for the new record
            dataToSave.project_id = projectId;
            
            const columns = Object.keys(dataToSave).map(key => `\`${key}\``).join(', ');
            const placeholders = Object.keys(dataToSave).map(() => '?').join(', ');
            const values = Object.values(dataToSave);

            if (values.length > 0) {
              await connection.query(`INSERT INTO project_details (${columns}) VALUES (${placeholders})`, values);
            }
        }
        
        await connection.commit();
        
        const updatedDetails = await getProjectDetailsByProjectId(projectId);
        if (!updatedDetails) {
            throw new Error('Failed to retrieve project details after update.');
        }
        return updatedDetails;

    } catch (error) {
        await connection.rollback();
        console.error("Error in createOrUpdateProjectDetails: ", error); // Log the actual error
        throw error; // Re-throw to be handled by the controller
    } finally {
        connection.release();
    }
};


export const createProject = async (
  projectData: { name: string; description?: string; endDate?: string; picId?: number; memberIds?: number[] },
  userId: number
): Promise<Project> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, description, endDate, picId, memberIds } = projectData;
    const projectUUID = generateUUID();

    const [result] = await connection.query(
      'INSERT INTO projects (uuid, name, description, created_by, pic_id, end_date) VALUES (?, ?, ?, ?, ?, ?)',
      [
        projectUUID, 
        name, 
        description || null, 
        userId, 
        picId || null, 
        endDate || null
      ]
    );
    
    const projectId = (result as any).insertId;

    if (memberIds && memberIds.length > 0) {
      const memberValues = memberIds.map(memberId => [projectId, memberId]);
      await connection.query('INSERT INTO project_members (project_id, user_id) VALUES ?', [memberValues]);
    }

    await connection.commit();

    const newProject = await getProjectById(projectId);
    if (!newProject) {
        throw new Error("Failed to fetch newly created project.");
    }

    // Create notifications for project assignment
    if (memberIds && memberIds.length > 0) {
        try {
            // Filter out the creator from getting notification
            const notificationRecipients = memberIds.filter(id => id !== userId);
            if (notificationRecipients.length > 0) {
                await createProjectAssignedNotification(userId, notificationRecipients, projectId, name);
            }
        } catch (notificationError) {
            console.error('Failed to create project assignment notification:', notificationError);
        }
    }

    return newProject;

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateProject = async (
  projectId: number,
  projectData: { name?: string; description?: string; status?: 'planning' | 'in_progress' | 'on_hold' | 'completed'; endDate?: string; picId?: number; memberIds?: number[] }
): Promise<Project> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { memberIds, ...projectFields } = projectData;

    const dbFieldMapping: { [key: string]: string } = {
        endDate: 'end_date',
        picId: 'pic_id'
    };

    const fieldsToUpdate = Object.entries(projectFields)
        .filter(([, value]) => value !== undefined && value !== null)
        .reduce((acc, [key, value]) => {
            const dbKey = dbFieldMapping[key] || key;
            acc[dbKey] = value;
            return acc;
        }, {} as { [key: string]: any });


    if (Object.keys(fieldsToUpdate).length > 0) {
      const setClause = Object.keys(fieldsToUpdate).map(key => `\`${key}\` = ?`).join(', ');
      const values = Object.values(fieldsToUpdate);
      await connection.query(
        `UPDATE projects SET ${setClause} WHERE id = ?`,
        [...values, projectId]
      );
    }

    if (memberIds !== undefined) {
      await connection.query('DELETE FROM project_members WHERE project_id = ?', [projectId]);
      if (memberIds.length > 0) {
        const memberValues = memberIds.map(memberId => [projectId, memberId]);
        await connection.query('INSERT INTO project_members (project_id, user_id) VALUES ?', [memberValues]);
      }
    }

    await connection.commit();
    
    const updatedProject = await getProjectById(projectId);
    if (!updatedProject) {
        throw new Error("Failed to fetch updated project.");
    }
    return updatedProject;

  } catch (error) {
    await connection.rollback();
    console.error("Error updating project:", error);
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteProject = async (projectId: number): Promise<void> => {
  await pool.query('DELETE FROM projects WHERE id = ?', [projectId]);
};

export const getAllProjects = async (userId: number, roleId: number): Promise<Project[]> => {
  let query = `
    SELECT
      p.id,
      p.name,
      p.description,
      p.status,
      p.end_date as deadline,
      p.pic_id,
      pic.full_name AS pic_name,
      pic.avatar_url AS pic_avatar,
      (SELECT COUNT(t.id) FROM tasks t WHERE t.project_id = p.id) AS total_tasks,
      (SELECT COUNT(t.id) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS completed_tasks,
      COALESCE(
        (SELECT
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', mem.id,
              'name', mem.full_name,
              'avatar', mem.avatar_url
            )
          )
        FROM project_members pm
        JOIN users mem ON pm.user_id = mem.id
        WHERE pm.project_id = p.id),
      '[]') AS members_json
    FROM
      projects p
    LEFT JOIN
      users pic ON p.pic_id = pic.id
  `;
  
  const params: any[] = [];

  // Define the base WHERE clause holder
  let whereClauses: string[] = [];

  // Apply role-based filtering
  if (roleId === 2 || roleId === 4) {
    // PICs/Managers see projects they are assigned to as PIC
    whereClauses.push('p.pic_id = ?');
    params.push(userId);
  } else if (roleId !== 1) {
    // Other roles (except admin) see projects they are members of
    whereClauses.push('EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?)');
    params.push(userId);
  }
  // Admin (roleId 1) has no WHERE clause, sees all

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' GROUP BY p.id;';

  const [rows] = await pool.query<ProjectFromDB[]>(query, params);
  
  const projects: Project[] = rows.map(p => {
    const progress = p.total_tasks > 0 ? Math.round((p.completed_tasks / p.total_tasks) * 100) : 0;
    
    return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        status: mapStatus(p.status),
        progress: progress,
        deadline: p.deadline,
        pic: p.pic_id ? { id: p.pic_id, name: p.pic_name || 'N/A', avatar: p.pic_avatar } : null,
        members: JSON.parse(p.members_json || '[]'),
    };
  });

  return projects;
};

interface CsvImportResult {
    successful: number;
    failed: number;
    errors: { row: number, reason: string }[];
}

export const importProjectsFromCsv = async (fileContent: string, creatorId: number): Promise<CsvImportResult> => {
    return new Promise((resolve, reject) => {
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
                    const { name, description, team_uuid, status, start_date, end_date } = row;
                    
                    if (!name) {
                        errors.push({ row: rowIndex, reason: 'Missing required field: name.' });
                        failed++;
                        continue;
                    }

                    try {
                        await connection.beginTransaction();

                        let teamId = null;
                        if (team_uuid) {
                            const [teamRows] = await connection.query<RowDataPacket[]>('SELECT id FROM teams WHERE uuid = ?', [team_uuid]);
                            if (teamRows.length > 0) {
                                teamId = teamRows[0].id;
                            } else {
                                throw new Error(`Team with UUID '${team_uuid}' not found.`);
                            }
                        }

                        const projectUuid = uuidv4();
                        await connection.query(
                            `INSERT INTO projects (uuid, name, description, team_id, created_by, status, start_date, end_date)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [projectUuid, name, description || null, teamId, creatorId, status || 'planning', start_date || null, end_date || null]
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