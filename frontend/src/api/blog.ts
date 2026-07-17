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

export const getPendingBlogDrafts = async (params: { page?: number; limit?: number } = {}) => {
  const response = await api.get('/blogs/drafts/pending', { params, withCredentials: true });
  return response.data;
};

export const getBlogDraft = async (pendingId: number) => {
  const response = await api.get(`/blogs/drafts/${pendingId}`, { withCredentials: true });
  return response.data;
};

export const deleteBlogDraft = async (pendingId: number) => {
  const response = await api.delete(`/blogs/drafts/${pendingId}`, { withCredentials: true });
  return response.data;
};

export const reviewBlogDraft = async (pendingId: number, data: { reviewer_id: number; action: 'approve' | 'reject' }) => {
  const response = await api.post(`/blogs/drafts/${pendingId}/review`, data, { withCredentials: true });
  return response.data;
};

export const getBlogRevisions = async (slug: string, params: { page?: number; limit?: number } = {}) => {
  const response = await api.get(`/blogs/${slug}/revisions`, { params });
  return response.data;
};

export const revertBlog = async (slug: string, revisionId: number) => {
  const response = await api.post(`/blogs/${slug}/revisions/${revisionId}/revert`, {}, { withCredentials: true });
  return response.data;
};
