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
  is_pinned?: boolean;
  icon?: string;
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
  activeTier: "bronze" | "silver" | "gold";
  setActiveTier: React.Dispatch<React.SetStateAction<"bronze" | "silver" | "gold">>;
  settingsTab: "appearance" | "layout" | "search" | "alerts" | null;
  setSettingsTab: React.Dispatch<React.SetStateAction<"appearance" | "layout" | "search" | "alerts" | null>>;
  totalPagesCount: number | null;
  setTotalPagesCount: React.Dispatch<React.SetStateAction<number | null>>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
