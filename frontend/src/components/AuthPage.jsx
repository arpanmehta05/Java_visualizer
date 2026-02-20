import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Hexagon, Loader2 } from "lucide-react";

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
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Hexagon size={28} className="text-blue-500" />
          <span className="text-xl font-bold text-gray-100 tracking-tight">
            JDI Visualizer
          </span>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-700">
          <button
            className={`flex-1 pb-2.5 text-sm font-medium transition-colors ${
              mode === "login"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
            onClick={() => {
              setMode("login");
              setLocalError(null);
            }}
          >
            Sign In
          </button>
          <button
            className={`flex-1 pb-2.5 text-sm font-medium transition-colors ${
              mode === "register"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
            onClick={() => {
              setMode("register");
              setLocalError(null);
            }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {mode === "login" ? "Username or Email" : "Username"}
            </span>
            <input
              className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-800 border border-gray-600 rounded-md placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === "login" ? "user@example.com" : "johndoe"}
              autoComplete="username"
            />
          </label>

          {mode === "register" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Email
              </span>
              <input
                className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-800 border border-gray-600 rounded-md placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                autoComplete="email"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Password
            </span>
            <input
              className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-800 border border-gray-600 rounded-md placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Min 8 characters" : ""}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>

          {localError && (
            <div className="px-3 py-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
              {localError}
            </div>
          )}

          <button
            className="flex items-center justify-center gap-2 w-full py-2.5 mt-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={submitting}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting
              ? "Please wait..."
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
