import { useState, useEffect, useCallback } from "react";
import { AuthContext, type User } from "./AuthContext";
import {api} from "../lib/api";


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<boolean | null>(null);
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

  useEffect(() => {
    const id = setTimeout(() => {
      void checkAuth();
    }, 0);

    return () => clearTimeout(id);
  }, [checkAuth]);

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
      }}>
      {children}
    </AuthContext.Provider>
  );
}
