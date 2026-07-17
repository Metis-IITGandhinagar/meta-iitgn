import { api } from '../lib/api';

export interface UserCreateInput {
  name: string;
  email: string;
  avatar_url?: string | null;
  role?: string;
}

export const getUsers = async () => {
  const response = await api.get('/user');
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
