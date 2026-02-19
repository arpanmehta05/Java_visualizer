import { useTheme } from "../themes/ThemeContext";

function ThemeSwitcher() {
  const { themeId, setTheme, allThemes } = useTheme();
  const keys = Object.keys(allThemes);

  return (
    <div className="theme-switcher">
      {keys.map((k) => (
        <button
          key={k}
          className={`theme-switcher-btn${themeId === k ? " active" : ""}`}
          onClick={() => setTheme(k)}
          title={allThemes[k].label}
        >
          <span
            className="theme-swatch"
            style={{
              background: allThemes[k].tokens["--bg-base"],
              borderColor: allThemes[k].tokens["--border-bright"],
            }}
          />
          <span className="theme-switcher-label">{allThemes[k].label}</span>
        </button>
      ))}
    </div>
  );
}

export default ThemeSwitcher;
