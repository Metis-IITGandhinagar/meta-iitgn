import { api } from "../lib/api";

export interface NewsItem {
  page_id: number;
  title: string;
  slug: string;
  content: string;
  metadata: any;
  video_url?: string;
  created_at: string;
  updated_at: string;
  description?: string;
}

export interface NewsResponse {
  news: NewsItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const getNewsList = async (params: { page?: number; limit?: number } = {}): Promise<NewsResponse> => {
  const response = await api.get("/news", { params });
  return response.data;
};

export const createNews = async (data: { title: string; content: string; video_url?: string }): Promise<NewsItem> => {
  const response = await api.post("/news", data, { withCredentials: true });
  return response.data;
};

export const updateNews = async (slug: string, data: { title?: string; content?: string; video_url?: string }): Promise<NewsItem> => {
  const response = await api.patch(`/news/${slug}`, data, { withCredentials: true });
  return response.data;
};

export const deleteNews = async (slug: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/news/${slug}`, { withCredentials: true });
  return response.data;
};
