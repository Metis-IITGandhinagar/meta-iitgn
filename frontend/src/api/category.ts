import { api } from "../lib/api";
import { Category } from "../context/AuthContext";

export const getCategories = async (): Promise<Category[]> => {
  const res = await api.get("/categories");
  return res.data;
};

export const createCategory = async (data: { name: string; description: string }): Promise<Category> => {
  const res = await api.post("/categories", data, { withCredentials: true });
  return res.data;
};

export const updateCategory = async (id: number, data: { name?: string; description?: string }): Promise<Category> => {
  const res = await api.patch(`/categories/${id}`, data, { withCredentials: true });
  return res.data;
};
