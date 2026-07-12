import { useState, useEffect, useCallback } from "react";
import { AuthContext, type User, type Category } from "./AuthContext";
import { api } from "../lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const logout = async () => {
    try {
      await api.post(
        "/user/auth/logout",
        {},
        {
          withCredentials: true,
        },
      );
    } catch (err) {
      console.log(err);
    } finally {
      setUser(null);
      setAuth(false);
      setLoading(false);
    }
  };

  const checkAuth = useCallback(async () => {
    try {
      const [userRes] = await Promise.all([
        api.get("/user/auth/me"),
      ]);

      setUser(userRes.data.user);
      setAuth(true);
    } catch {
      setUser(null);
      setAuth(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const cached = localStorage.getItem("wiki-categories");
      if (cached) {
        setCategories(JSON.parse(cached));
      } else {
        const res = await api.get("/categories");
        setCategories(res.data);
        localStorage.setItem("wiki-categories", JSON.stringify(res.data));
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  const addCategoryState = useCallback((newCat: Category) => {
    setCategories((prev) => {
      const updated = [...prev, newCat];
      localStorage.setItem("wiki-categories", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateCategoryState = useCallback((updatedCat: Category) => {
    setCategories((prev) => {
      const updated = prev.map((cat) =>
        cat.category_id === updatedCat.category_id ? updatedCat : cat
      );
      localStorage.setItem("wiki-categories", JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void checkAuth();
    }, 0);

    return () => clearTimeout(id);
  }, [checkAuth]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return (
    <AuthContext.Provider
      value={{
        user,
        auth,
        loading,
        setAuth,
        setUser,
        logout,
        checkAuth,
        categories,
        setCategories,
        addCategoryState,
        updateCategoryState,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
