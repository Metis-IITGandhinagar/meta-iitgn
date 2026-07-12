import { api } from '../lib/api';

export const getRecentNewPages = async (limit = 5) => {
  const response = await api.get('/pages/recent/new', { params: { limit } });
  return response.data;
};

export const getRecentUpdatedPages = async (limit = 5) => {
  const response = await api.get('/pages/recent/updated', { params: { limit } });
  return response.data;
};

export const searchPages = async (query: string) => {
  const response = await api.get('/pages/search', { params: { query } });
  return response.data;
};

export const getPage = async (slug: string) => {
  const response = await api.get(`/pages/${slug}`);
  return response.data;
};

export const getPageStats = async () => {
  const response = await api.get('/pages/stats');
  return response.data;
};
