import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { THEMES } from "./definitions";

const ThemeContext = createContext(null);

const STORAGE_KEY = "jdi-visualizer-theme";

function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "dark";
    } catch {
      return "dark";
    }
  });

  const theme = useMemo(() => THEMES[themeId] || THEMES.dark, [themeId]);

  useEffect(() => {
    const root = document.documentElement;
    const tokens = theme.tokens;
    Object.entries(tokens).forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
    });
    root.setAttribute("data-theme", theme.id);
    try {
      localStorage.setItem(STORAGE_KEY, theme.id);
    } catch {}
  }, [theme]);

  const setTheme = useCallback((id) => {
    if (THEMES[id]) setThemeId(id);
  }, []);

  const cycleTheme = useCallback(() => {
    const keys = Object.keys(THEMES);
    const idx = keys.indexOf(themeId);
    setThemeId(keys[(idx + 1) % keys.length]);
  }, [themeId]);

  const value = useMemo(
    () => ({ theme, themeId, setTheme, cycleTheme, allThemes: THEMES }),
    [theme, themeId, setTheme, cycleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export { ThemeProvider, useTheme };
