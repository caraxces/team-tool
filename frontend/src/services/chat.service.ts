import api from './api';
import { Message } from '@/types/chat.type';

export const findOrCreateConversation = async (otherUserId: number): Promise<number> => {
    const { data } = await api.post('/chat/conversations', { otherUserId });
    return data.data.conversationId;
};

export const getMessages = async (conversationId: number): Promise<Message[]> => {
    const { data } = await api.get(`/chat/conversations/${conversationId}/messages`);
    return data.data.messages;
};

export const sendMessage = async (conversationId: number, content: string): Promise<Message> => {
    const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
    return data.data.message;
}; 