import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(username || email, password);
      } else {
        if (!username || !email || !password) {
          setLocalError("All fields are required");
          return;
        }
        await register(username, email, password);
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">{"\u2B21"}</span>
          <span className="logo-text">JDI Visualizer</span>
        </div>
        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === "login" ? " auth-tab--active" : ""}`}
            onClick={() => {
              setMode("login");
              setLocalError(null);
            }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab${mode === "register" ? " auth-tab--active" : ""}`}
            onClick={() => {
              setMode("register");
              setLocalError(null);
            }}
          >
            Register
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            {mode === "login" ? "Username or Email" : "Username"}
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === "login" ? "user@example.com" : "johndoe"}
              autoComplete="username"
            />
          </label>
          {mode === "register" && (
            <label className="auth-label">
              Email
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                autoComplete="email"
              />
            </label>
          )}
          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Min 8 characters" : ""}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>
          {localError && <div className="auth-error">{localError}</div>}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? "Please wait\u2026"
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
