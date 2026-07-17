import { api } from '../lib/api';

export interface UserCreateInput {
  name: string;
  email: string;
  avatar_url?: string | null;
  role?: string;
}

export const getUsers = async (params: { page?: number; limit?: number } = {}) => {
  const response = await api.get('/user', { params, withCredentials: true });
  return response.data;
};

export const getUsersCount = async () => {
  const response = await api.get('/user/count', { withCredentials: true });
  return response.data;
};

export const updateUserRole = async (userId: number, role: 'admin' | 'moderator' | 'normal') => {
  const response = await api.put(`/user/${userId}/role`, { role }, { withCredentials: true });
  return response.data;
};

export const getAuditLogs = async (params: { page?: number; limit?: number } = {}) => {
  const response = await api.get('/audit-logs', { params, withCredentials: true });
  return response.data;
};

export const devBypass = async (data: UserCreateInput) => {
  const response = await api.post('/user', data);
  return response.data;
};

export const getUserStats = async (userId: number) => {
  const response = await api.get(`/user/${userId}/stats`, { withCredentials: true });
  return response.data;
};

export const getUserById = async (userId: number) => {
  const response = await api.get(`/user/${userId}`);
  return response.data;
};

export const getUserBookmarks = async (userId: number) => {
  const response = await api.get(`/user/${userId}/bookmarks`, { withCredentials: true });
  return response.data;
};
