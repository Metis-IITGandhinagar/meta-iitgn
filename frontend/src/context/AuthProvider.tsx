import { useState, useEffect, useCallback } from "react";
import { AuthContext, type User, type Category } from "./AuthContext";
import { api } from "../lib/api";

import { db } from "../lib/db";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTier, setActiveTier] = useState<"bronze" | "silver" | "gold">("bronze");
  const [settingsTab, setSettingsTab] = useState<"appearance" | "layout" | "search" | "alerts" | null>(null);
  const [totalPagesCount, setTotalPagesCountState] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wiki-total-pages-count");
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });

  const setTotalPagesCount = useCallback((val: any) => {
    setTotalPagesCountState((prev: any) => {
      const nextVal = typeof val === "function" ? val(prev) : val;
      if (nextVal !== null) {
        localStorage.setItem("wiki-total-pages-count", String(nextVal));
      } else {
        localStorage.removeItem("wiki-total-pages-count");
      }
      return nextVal;
    });
  }, []);

  useEffect(() => {
    if (user?.role) {
      const r = user.role.toLowerCase();
      if (r === "admin") setActiveTier("gold");
      else if (r === "moderator") setActiveTier("silver");
      else setActiveTier("bronze");
    }
  }, [user?.role]);

  useEffect(() => {
    if (loading) return;

    // Detect user change to clear Dexie DB and localStorage caches for privacy and protection
    const storedUserKey = "wiki-current-user-id";
    const currentUserId = user ? String(user.user_id) : "guest";
    const previousUserId = localStorage.getItem(storedUserKey);

    if (previousUserId !== null && previousUserId !== currentUserId) {
      localStorage.removeItem("syncCheck");
      const clearDb = async () => {
        try {
          await Promise.all([
            db.bookmarks.clear(),
            db.news.clear(),
            db.contributors.clear(),
            db.pendingpages.clear(),
            db.updatedpages.clear(),
            db.meta.clear(),
          ]);
        } catch (e) {
          console.error("Failed to clear Dexie DB on user change:", e);
        }
      };
      clearDb();
    }
    localStorage.setItem(storedUserKey, currentUserId);
  }, [user, loading]);

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
      setTotalPagesCount(null);
      localStorage.removeItem("syncCheck");
      try {
        await db.bookmarks.clear();
        await db.news.clear();
        await db.contributors.clear();
        await db.pendingpages.clear();
        await db.updatedpages.clear();
        await db.meta.clear();
      } catch (e) {
        console.error("Failed to clear Dexie DB on logout:", e);
      }
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
      const res = await api.get("/categories");
      setCategories(res.data);
      localStorage.setItem("wiki-categories", JSON.stringify(res.data));
    } catch (err) {
      console.error("Error fetching categories:", err);
      const cached = localStorage.getItem("wiki-categories");
      if (cached) {
        setCategories(JSON.parse(cached));
      }
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
        activeTier,
        setActiveTier,
        settingsTab,
        setSettingsTab,
        totalPagesCount,
        setTotalPagesCount,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
