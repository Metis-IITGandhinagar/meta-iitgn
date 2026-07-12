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

interface AuthContextType {
  user: User | null;
  auth: boolean | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setAuth: React.Dispatch<React.SetStateAction<boolean | null>>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
