import api from './api';
import { User } from '@/types/user.type';

// Types will be defined here or imported from a central types file

export interface KnowledgeItem {
    id: number;
    uuid: string;
    title: string;
    link: string;
    description: string | null;
    status: 'pending' | 'done';
    createdAt: string;
    updatedAt: string;
    createdBy: User;
    assignee: User | null;
}

export interface CreateKnowledgeItemPayload {
    title: string;
    link: string;
    description?: string;
    assigneeId?: number;
}


export const getKnowledgeItems = async (): Promise<KnowledgeItem[]> => {
    const response = await api.get('/knowledge');
    return response.data.data.items;
};

export const createKnowledgeItem = async (payload: CreateKnowledgeItemPayload): Promise<KnowledgeItem> => {
    const response = await api.post('/knowledge', payload);
    return response.data.data.item;
};

export const markKnowledgeItemAsDone = async (id: number): Promise<KnowledgeItem> => {
    const response = await api.patch(`/knowledge/${id}/status`);
    return response.data.data.item;
};

export const deleteKnowledgeItem = async (id: number): Promise<void> => {
    await api.delete(`/knowledge/${id}`);
}; 