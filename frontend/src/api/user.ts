import { api } from '../lib/api';

export interface UserCreateInput {
  name: string;
  email: string;
  avatar_url?: string | null;
}

export const getUsers = async () => {
  const response = await api.get('/user');
  return response.data;
};

export const devBypass = async (data: UserCreateInput) => {
  const response = await api.post('/user', data);
  return response.data;
};
