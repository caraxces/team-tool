import api from './api';
import { Task, CreateTaskPayload } from '@/types/task.type';


export const getTasksByProjectId = async (projectId: number): Promise<Task[]> => {
    const { data } = await api.get(`/tasks/project/${projectId}`);
    return data.data;
};

export const createTask = async (taskData: CreateTaskPayload): Promise<Task> => {
    const { data } = await api.post('/tasks', taskData);
    return data.data;
};

export const updateTaskStatus = async (taskId: number, status: 'todo' | 'in_progress' | 'in_review' | 'done'): Promise<void> => {
    await api.patch(`/tasks/${taskId}/status`, { status });
};

export const updateTask = async (taskId: number, taskData: Partial<CreateTaskPayload>): Promise<Task> => {
    const { data } = await api.put(`/tasks/${taskId}`, taskData);
    return data.data;
};

export const getAllTasksForMentions = async (): Promise<{ id: string, display: string }[]> => {
    // This endpoint will need to be created in the backend.
    const { data } = await api.get('/tasks/for-mentions');
    return data.data.tasks;
}

export const getMyTasks = async (): Promise<Task[]> => {
  const { data } = await api.get('/tasks/my-tasks');
  return data.data.tasks; // Correctly extract the tasks array
};

export const deleteTask = async (taskId: number) => {
    return api.delete(`/tasks/${taskId}`);
};

export const downloadTaskCsvTemplate = async () => {
    const response = await api.get('/tasks/csv-template', {
        responseType: 'blob', // Important to handle file download
    });
    return response.data;
};

export const importTasksFromCsv = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/tasks/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

export const getTaskStats = async () => {
    const { data } = await api.get('/tasks/stats');
    return data.data;
}; 