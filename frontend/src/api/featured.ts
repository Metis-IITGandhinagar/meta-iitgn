import { api } from '../lib/api';

export const getFeaturedPages = async () => {
  const response = await api.get('/pages/featured');
  return response.data;
};

export const setFeaturedPage = async (data: { page_id: number; order?: number; tag?: string; location?: string; description?: string }) => {
  const response = await api.post('/pages/featured', data, { withCredentials: true });
  return response.data;
};

export const removeFeaturedPage = async (featuredId: number) => {
  const response = await api.delete(`/pages/featured/${featuredId}`, { withCredentials: true });
  return response.data;
};

export const updateFeaturedPage = async (featuredId: number, data: { order?: number; tag?: string; location?: string; description?: string }) => {
  const response = await api.put(`/pages/featured/${featuredId}`, data, { withCredentials: true });
  return response.data;
};
