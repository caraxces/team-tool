import api from './api';
import { User } from '@/types/user.type';

export const getMe = async (): Promise<User> => {
    const { data } = await api.get('/users/me');
    return data.data.user;
};

export const getUsers = async () => {
    const { data } = await api.get('/users');
    // The backend returns { success: true, data: [ ...users ] }
    // So we need to return data.data which is the array of users.
    return data.data;
};

export const getUsersByProjectId = async (projectId: number): Promise<User[]> => {
    const { data } = await api.get(`/projects/${projectId}/users`);
    return data.data.users;
};

export const getMyTeams = async (): Promise<any> => {
    const response = await api.get('/users/me/teams');
    return response.data.data.teams;
}

export const getAllUsers = async (): Promise<any[]> => {
    const response = await api.get('/users');
    return response.data.data;
};

export const updateUserRole = async (userId: number, roleId: number): Promise<any> => {
    const response = await api.put(`/users/${userId}/role`, { roleId });
    return response.data.data;
};

export const updateMyProfile = async (userData: { fullName: string }): Promise<User> => {
    const response = await api.patch('/users/me/profile', userData);
    return response.data.data.user;
}; 

export const uploadAvatar = async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const { data } = await api.put('/users/me/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return data.data.user;
}; 