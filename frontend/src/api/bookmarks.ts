import { api } from "../lib/api";

export interface BookmarkItem {
  bookmark_id: number;
  id: string;
  title: string;
  category: string;
  slug: string;
  description: string;
}

export const getBookmarksList = async (): Promise<BookmarkItem[]> => {
  const response = await api.get("/bookmarks", { withCredentials: true });
  return response.data;
};

export const addBookmark = async (data: { page_id?: number; slug?: string }): Promise<BookmarkItem> => {
  const response = await api.post("/bookmarks", data, { withCredentials: true });
  return response.data;
};

export const removeBookmark = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/bookmarks/${id}`, { withCredentials: true });
  return response.data;
};
