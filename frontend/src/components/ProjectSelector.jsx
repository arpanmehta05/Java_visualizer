import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

function ProjectSelector({ projects, onSelect, onCreate, onDelete }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const { user, logout } = useAuth();

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const proj = await onCreate(name.trim(), desc.trim());
      onSelect(proj._id);
      setCreating(false);
      setName("");
      setDesc("");
    } catch (_) {}
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480, width: "100%" }}>
        <div className="auth-logo">
          <span className="logo-icon">{"\u2B21"}</span>
          <span className="logo-text">Your Projects</span>
        </div>
        <div className="ps-user-bar">
          <span className="ps-username">{user?.username}</span>
          <button className="ps-logout" onClick={logout}>
            Logout
          </button>
        </div>
        {!creating ? (
          <>
            <div className="ps-list">
              {projects.map((p) => (
                <div key={p._id} className="ps-item">
                  <div className="ps-item-info" onClick={() => onSelect(p._id)}>
                    <span className="ps-item-name">{p.name}</span>
                    <span className="ps-item-desc">
                      {p.description || "No description"}
                    </span>
                  </div>
                  <button
                    className="ps-item-del"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p._id);
                    }}
                  >
                    {"\u2715"}
                  </button>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="fe-empty" style={{ padding: 20 }}>
                  No projects yet. Create your first one!
                </div>
              )}
            </div>
            <button
              className="auth-submit"
              style={{ marginTop: 12 }}
              onClick={() => setCreating(true)}
            >
              + New Project
            </button>
          </>
        ) : (
          <form className="auth-form" onSubmit={handleCreate}>
            <label className="auth-label">
              Project Name
              <input
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="MyJavaProject"
                autoFocus
              />
            </label>
            <label className="auth-label">
              Description
              <input
                className="auth-input"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Optional"
              />
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="auth-submit" type="submit">
                Create
              </button>
              <button
                className="auth-submit"
                type="button"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                }}
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProjectSelector;
