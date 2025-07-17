import pool from '../../config/database';
import { RowDataPacket } from 'mysql2/promise';
import { Template, CreateTemplateDto, UpdateTemplateDto, TemplateProjectDefinition, TemplateTaskDefinition } from '../../types/template.types';
import { generateUUID } from '../utils/uuid.util';
import { createOrUpdateProjectDetails } from './project.service';

export const createTemplate = async (templateData: CreateTemplateDto, userId: number): Promise<Template> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { projects, ...templateFields } = templateData;
        
        const templateResult = await connection.query<any>(
            `INSERT INTO templates (name, description, created_by) VALUES (?, ?, ?)`,
            [templateFields.name, templateFields.description, userId]
        );
        const templateId = templateResult[0].insertId;

        if (projects && projects.length > 0) {
            for (const projectDef of projects) {
                const projectResult = await connection.query<any>(
                    'INSERT INTO template_projects (project_name_template, project_description_template, start_day, duration_days, template_id) VALUES (?, ?, ?, ?, ?)',
                    [projectDef.name, projectDef.description, projectDef.start_day, projectDef.duration_days, templateId]
                );
                const templateProjectId = projectResult[0].insertId;

                if (projectDef.tasks && projectDef.tasks.length > 0) {
                    for (const taskDef of projectDef.tasks) {
                        await connection.query(
                            'INSERT INTO template_tasks (template_project_id, task_name_template, task_description_template, start_day, duration_days) VALUES (?, ?, ?, ?, ?)',
                            [templateProjectId, taskDef.title, taskDef.description, taskDef.start_day, taskDef.duration_days]
                        );
                    }
                }
            }
        }

        await connection.commit();
        
        const newTemplate = await getTemplateById(templateId);
        if (!newTemplate) {
            throw new Error('Failed to retrieve newly created template.');
        }
        return newTemplate;

    } catch (error) {
        await connection.rollback();
        console.error("Error in createTemplate:", error);
        throw new Error('Failed to create template.');
    } finally {
        connection.release();
    }
};

export const getTemplates = async (): Promise<Pick<Template, 'id' | 'name' | 'description' | 'created_at' | 'updated_at'>[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name, description, created_at, updated_at FROM templates ORDER BY created_at DESC');
    return rows as Pick<Template, 'id' | 'name' | 'description' | 'created_at' | 'updated_at'>[];
};

export const getTemplateById = async (id: number): Promise<Template | null> => {
    const [templateRows] = await pool.query<RowDataPacket[]>('SELECT * FROM templates WHERE id = ?', [id]);
    if (templateRows.length === 0) return null;

    const template = templateRows[0] as Template;

    const [projectRows] = await pool.query<RowDataPacket[]>('SELECT * FROM template_projects WHERE template_id = ?', [id]);
    template.projects = projectRows as TemplateProjectDefinition[];

    for (const project of template.projects) {
        const [taskRows] = await pool.query<RowDataPacket[]>('SELECT * FROM template_tasks WHERE template_project_id = ?', [project.id]);
        project.tasks = taskRows as TemplateTaskDefinition[];
    }

    return template;
};

export const updateTemplate = async (id: number, templateData: UpdateTemplateDto): Promise<Template> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { projects, ...templateFields } = templateData;
        
        const updateEntries = Object.entries(templateFields).filter(([_, value]) => value !== undefined);
        if (updateEntries.length > 0) {
            const setClause = updateEntries.map(([key, _]) => `${key} = ?`).join(', ');
            const values = updateEntries.map(([_, value]) => value);
            await connection.query(
                `UPDATE templates SET ${setClause} WHERE id = ?`,
                [...values, id]
            );
        }

        // Simplest approach for updating nested objects: delete and recreate.
        const [projectDefs] = await connection.query<RowDataPacket[]>('SELECT id FROM template_projects WHERE template_id = ?', [id]);
        for(const pDef of projectDefs) {
            await connection.query('DELETE FROM template_tasks WHERE template_project_id = ?', [pDef.id]);
        }
        await connection.query('DELETE FROM template_projects WHERE template_id = ?', [id]);

        if (projects && projects.length > 0) {
            for (const projectDef of projects) {
                const projectResult = await connection.query<any>(
                    'INSERT INTO template_projects (template_id, project_name_template, project_description_template, start_day, duration_days) VALUES (?, ?, ?, ?, ?)',
                    [id, projectDef.name, projectDef.description, projectDef.start_day, projectDef.duration_days]
                );
                const templateProjectId = projectResult[0].insertId;

                if (projectDef.tasks && projectDef.tasks.length > 0) {
                    for (const taskDef of projectDef.tasks) {
                        await connection.query(
                            'INSERT INTO template_tasks (template_project_id, task_name_template, task_description_template, start_day, duration_days) VALUES (?, ?, ?, ?, ?)',
                            [templateProjectId, taskDef.title, taskDef.description, taskDef.start_day, taskDef.duration_days]
                        );
                    }
                }
            }
        }
        
        await connection.commit();
        
        const updatedTemplate = await getTemplateById(id);
        if (!updatedTemplate) {
            throw new Error('Failed to retrieve updated template.');
        }
        return updatedTemplate;
    } catch (error) {
        await connection.rollback();
        console.error("Error in updateTemplate:", error);
        throw new Error('Failed to update template.');
    } finally {
        connection.release();
    }
};

export const deleteTemplate = async (id: number): Promise<void> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Foreign key constraints with ON DELETE CASCADE should handle deleting child rows.
        const [result] = await connection.query<any>('DELETE FROM templates WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new Error('Template not found.');
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error("Error in deleteTemplate:", error);
        if (error instanceof Error) throw error;
        throw new Error('Failed to delete template.');
    } finally {
        connection.release();
    }
}; 

export interface GenerationParams {
    team_id: number;
    variables: { [key: string]: string }; 
    start_date: string; // Master start date for the whole process, e.g., '2023-01-15'
}

const replacePlaceholders = (text: any, variables: { [key: string]: string }): any => {
    if (typeof text !== 'string') return text;
    let result = text;
    for (const key in variables) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), variables[key]);
    }
    return result;
}

const replacePlaceholdersInObject = (obj: any, variables: { [key: string]: string }): any => {
    if (!obj) return null;
    const newObj = { ...obj };
    for (const key in newObj) {
        if (typeof newObj[key] === 'string') {
            newObj[key] = replacePlaceholders(newObj[key], variables);
        } else if (Array.isArray(newObj[key])) {
             newObj[key] = newObj[key].map((item: any) => replacePlaceholdersInObject(item, variables));
        } else if (typeof newObj[key] === 'object' && newObj[key] !== null) {
            newObj[key] = replacePlaceholdersInObject(newObj[key], variables);
        }
    }
    return newObj;
};

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

const formatDateToMySQL = (date: Date): string => {
    return date.toISOString().split('T')[0];
}

export const generateProjectsFromTemplate = async (templateId: number, params: GenerationParams, userId: number) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const template = await getTemplateById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        const masterStartDate = new Date(params.start_date);

        for (const projectDef of template.projects) {
            // Replace placeholders in project definition
            const finalProjectName = replacePlaceholders(projectDef.project_name_template, params.variables);
            const finalProjectDescription = replacePlaceholders(projectDef.project_description_template, params.variables);

            // Calculate project start and end dates
            const projectStartDate = addDays(masterStartDate, projectDef.start_day || 0);
            const projectEndDate = addDays(projectStartDate, projectDef.duration_days || 1);

            // Create the actual project
            const [projectResult] = await connection.query<any>(
                'INSERT INTO projects (uuid, name, description, team_id, created_by, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    generateUUID(),
                    finalProjectName,
                    finalProjectDescription,
                    params.team_id,
                    userId,
                    'planning',
                    formatDateToMySQL(projectStartDate),
                    formatDateToMySQL(projectEndDate)
                ]
            );
            const newProjectId = projectResult.insertId;

            // Generate tasks for this project
            if (projectDef.tasks && projectDef.tasks.length > 0) {
                for (const taskDef of projectDef.tasks) {
                    const finalTaskName = replacePlaceholders(taskDef.task_name_template, params.variables);
                    const finalTaskDescription = replacePlaceholders(taskDef.task_description_template, params.variables);
                    
                    const taskStartDate = addDays(projectStartDate, taskDef.start_day || 0);
                    const taskDueDate = addDays(taskStartDate, taskDef.duration_days || 1);

                    await connection.query(
                        'INSERT INTO tasks (uuid, title, description, project_id, reporter_id, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [
                            generateUUID(),
                            finalTaskName,
                            finalTaskDescription,
                            newProjectId,
                            userId, // Reporter is the user generating from the template
                            'todo',
                            formatDateToMySQL(taskDueDate)
                        ]
                    );
                }
            }
        }

        await connection.commit();
        // Maybe return the IDs of the created projects
        return { success: true, message: 'Projects generated successfully.' };

    } catch (error) {
        await connection.rollback();
        console.error("Error generating from template:", error);
        throw error;
    } finally {
        connection.release();
    }
}; 