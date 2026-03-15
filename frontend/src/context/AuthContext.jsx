import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  clearAccessToken,
  getCurrentUser,
  loginUser,
  registerAdmin,
  registerUser,
  setAccessToken,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem("access_token")) {
      setUser(null);
      return null;
    }
    const profile = await getCurrentUser();
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      if (!token) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
      }

      try {
        const profile = await getCurrentUser();
        if (isMounted) {
          setUser(profile);
        }
      } catch (error) {
        clearAccessToken();
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const tokenData = await loginUser({ email, password });
    setAccessToken(tokenData.access_token);
    setToken(tokenData.access_token);

    const profile = await getCurrentUser();
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(async (payload) => {
    return registerUser(payload);
  }, []);

  const createAdmin = useCallback(async (payload) => {
    return registerAdmin(payload);
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "admin",
      login,
      register,
      createAdmin,
      refreshProfile,
      logout,
    }),
    [token, user, loading, login, register, createAdmin, refreshProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
