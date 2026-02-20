import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const AuthContext = createContext(null);

const API = "/api/auth";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("jdi_token"));
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState(null);

  const saveToken = useCallback((t) => {
    setToken(t);
    if (t) localStorage.setItem("jdi_token", t);
    else localStorage.removeItem("jdi_token");
  }, []);

  const authHeaders = useCallback(() => {
    if (!token) return { "Content-Type": "application/json" };
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const fetchMe = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        saveToken(null);
        setUser(null);
      }
    } catch (_) {
      saveToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token, saveToken]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const register = useCallback(
    async (username, email, password) => {
      setError(null);
      try {
        const res = await fetch(`${API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        saveToken(data.token);
        setUser(data.user);
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [saveToken],
  );

  const login = useCallback(
    async (login, password) => {
      setError(null);
      try {
        const res = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        saveToken(data.token);
        setUser(data.user);
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [saveToken],
  );

  const logout = useCallback(() => {
    saveToken(null);
    setUser(null);
  }, [saveToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        authHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { AuthProvider, useAuth };
