import { api } from '../lib/api';

export const getBlogs = async (params: { page?: number; limit?: number } = {}) => {
  const response = await api.get('/blogs', { params });
  return response.data;
};

export const getBlog = async (slug: string) => {
  const response = await api.get(`/blogs/${slug}`);
  return response.data;
};

export const createBlog = async (data: { title: string; description?: string; content?: string }) => {
  const response = await api.post('/blogs', data, { withCredentials: true });
  return response.data;
};

export const updateBlog = async (slug: string, data: { title?: string; description?: string; content?: string }) => {
  const response = await api.put(`/blogs/${slug}`, data, { withCredentials: true });
  return response.data;
};

export const deleteBlog = async (slug: string) => {
  const response = await api.delete(`/blogs/${slug}`, { withCredentials: true });
  return response.data;
};
