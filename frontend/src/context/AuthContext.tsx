import { createContext } from "react";

export interface User {
  user_id: number;
  name: string;
  email: string;
  role: string;
  avatar_url: string;
  is_banned: boolean;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: number;
  slug: string;
  name: string;
  description: string;
  total_articles: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  auth: boolean | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setAuth: React.Dispatch<React.SetStateAction<boolean | null>>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  addCategoryState: (newCat: Category) => void;
  updateCategoryState: (updatedCat: Category) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
