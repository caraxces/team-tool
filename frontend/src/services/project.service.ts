import api from './api';
import { Project, ProjectDetails } from '@/types/project.type';

export const getMyProjects = async (): Promise<Project[]> => {
    const { data } = await api.get('/projects');
    return data.data.projects;
};

export const createProject = async (projectData: any): Promise<Project> => {
    const { data } = await api.post('/projects', projectData);
    return data.data.project;
};

export const updateProject = async (projectId: number, projectData: any): Promise<Project> => {
    const { data } = await api.put(`/projects/${projectId}`, projectData);
    return data.data.project;
};

export const deleteProject = async (projectId: number) => {
    await api.delete(`/projects/${projectId}`);
};

export const getAllProjectsForMentions = async () => {
    const { data } = await api.get('/projects/for-mentions');
    return data.data.projects;
};

export const downloadProjectCsvTemplate = async () => {
    const response = await api.get('/projects/csv-template', {
        responseType: 'blob',
    });
    return response.data;
};

export const importProjectsFromCsv = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/projects/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

export const getProjectDetails = async (projectId: number): Promise<ProjectDetails | null> => {
    const { data } = await api.get(`/projects/${projectId}/details`);
    return data.data.details;
};

export const updateProjectDetails = async (projectId: number, detailsData: Partial<ProjectDetails>): Promise<ProjectDetails> => {
    const { data } = await api.put(`/projects/${projectId}/details`, detailsData);
    return data.data.details;
}; 