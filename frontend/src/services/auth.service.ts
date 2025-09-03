import api from './api';
import { User } from '@/types/user.type';

interface LoginResponse {
  token: string;
  user: User;
}

export const login = async (credentials: any) => {
    const { data } = await api.post('/auth/login', credentials);
    // On successful login, backend returns { success: true, data: { token, user } }
    return data.data;
};

export const register = async (userData: any) => {
    const { data } = await api.post('/auth/register', userData);
    // On successful registration, backend returns { success: true, data: { token, user } }
    return data.data;
};

export const requestPasswordChange = async (): Promise<void> => {
    await api.post('/users/me/request-password-change');
};

export const changePassword = async (data: { token: string; newPassword: string }): Promise<void> => {
    await api.post('/users/me/change-password', data);
};

export const forgotPassword = async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
};

export const resetPassword = async (data: { token: string; newPassword: string }): Promise<void> => {
    await api.post('/auth/reset-password', data);
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
}; 