import api from './api';

export interface Role {
    id: number;
    name: string;
}

export const getRoles = async (): Promise<Role[]> => {
    const response = await api.get('/roles');
    return response.data.data;
};

export const createRole = async (roleData: { name: string, description?: string }): Promise<Role> => {
    const response = await api.post('/roles', roleData);
    return response.data.data;
};

export const updateRole = async (id: number, roleData: { name: string, description?: string }): Promise<Role> => {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data.data;
};

export const deleteRole = async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
}; 