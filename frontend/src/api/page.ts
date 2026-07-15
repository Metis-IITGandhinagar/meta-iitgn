import { api } from '../lib/api';

export const getRecentNewPages = async (limit = 4, page = 1) => {
  const response = await api.get('/pages/recent/new', { params: { limit, page } });
  return response.data;
};

export const getRecentUpdatedPages = async (limit = 4, page = 1) => {
  const response = await api.get('/pages/recent/updated', { params: { limit, page } });
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

export const getPageCount = async () => {
  const response = await api.get('/pages/count');
  return response.data;
};

export const uploadMedia = async (formData: FormData) => {
  const response = await api.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true,
  });
  return response.data;
};

export const getCategoryArticles = async (categorySlug: string, params: { page?: number; limit?: number } = {}) => {
  const response = await api.get(`/categories/${categorySlug}/articles`, { params });
  return response.data;
};

export const createPage = async (data: { title: string; content?: string; metadata?: any; video_url?: string }) => {
  const response = await api.post('/pages', data, { withCredentials: true });
  return response.data;
};

export const updatePage = async (slug: string, data: { title?: string; content?: string; metadata?: any; video_url?: string }) => {
  const response = await api.patch(`/pages/${slug}`, data, { withCredentials: true });
  return response.data;
};

export const deletePage = async (slug: string) => {
  const response = await api.delete(`/pages/${slug}`, { withCredentials: true });
  return response.data;
};

export const getSyncCheck = async () => {
  const response = await api.get('/pages/sync-check', { withCredentials: true });
  return response.data;
};

export const getPageById = async (pageId: number) => {
  const response = await api.get(`/pages/id/${pageId}`);
  return response.data;
};

export const getPageForEdit = async (slug: string) => {
  const response = await api.get(`/pages/${slug}/edit`, { withCredentials: true });
  return response.data;
};

export const getPopularPages = async (limit = 10) => {
  const response = await api.get('/pages/popular', { params: { limit } });
  return response.data;
};

export const incrementPageViewCount = async (slug: string) => {
  try {
    await api.post(`/pages/${slug}/view`);
  } catch {
    // Silent fail — view tracking should not block UX
  }
};

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

export const getEvents = async (limit = 20) => {
  const response = await api.get('/pages/events', { params: { limit } });
  return response.data;
};

export const getMessMenu = async () => {
  const response = await api.get('/pages/special/mess-menu');
  return response.data;
};

export const getCampusTransport = async () => {
  const response = await api.get('/pages/special/campus-transport');
  return response.data;
};
