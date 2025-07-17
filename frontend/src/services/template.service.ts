import api from './api';
import { Template, CreateTemplateDto, UpdateTemplateDto, TemplateSummary } from '@/types/template.type';

export const getTemplates = async (): Promise<TemplateSummary[]> => {
    const { data } = await api.get('/templates');
    return data.data;
};

export const getTemplateById = async (id: number): Promise<Template> => {
    const { data } = await api.get(`/templates/${id}`);
    return data.data;
};

export const createTemplate = async (templateData: CreateTemplateDto): Promise<Template> => {
    const { data } = await api.post('/templates', templateData);
    return data.data;
};

export const updateTemplate = async (id: number, templateData: UpdateTemplateDto): Promise<Template> => {
    const { data } = await api.put(`/templates/${id}`, templateData);
    return data.data;
};

export const deleteTemplate = async (id: number): Promise<void> => {
    await api.delete(`/templates/${id}`);
};

export interface GenerationParams {
    team_id: number;
    variables: { [key: string]: string };
    start_date: string; // Added to match backend
}

// Implement the generation service call
export const generateFromTemplate = async (id: number, params: GenerationParams): Promise<any> => {
    const { data } = await api.post(`/templates/${id}/generate`, params);
    return data.data;
}; 