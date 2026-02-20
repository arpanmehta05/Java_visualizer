import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Hexagon, Plus, Trash2, LogOut, FolderOpen } from "lucide-react";

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
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Hexagon size={28} className="text-blue-500" />
          <span className="text-xl font-bold text-gray-100 tracking-tight">
            Your Projects
          </span>
        </div>

        {/* User bar */}
        <div className="flex items-center justify-between mb-6 px-1">
          <span className="text-sm text-gray-400">{user?.username}</span>
          <button
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            onClick={logout}
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>

        {!creating ? (
          <>
            {/* Project list */}
            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto mb-4">
              {projects.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md cursor-pointer transition-colors group"
                  onClick={() => onSelect(p._id)}
                >
                  <FolderOpen size={18} className="text-blue-400/70 shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-200 truncate">
                      {p.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {p.description || "No description"}
                    </span>
                  </div>
                  <button
                    className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-sm"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p._id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-sm">
                  No projects yet. Create your first one!
                </div>
              )}
            </div>

            <button
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
              onClick={() => setCreating(true)}
            >
              <Plus size={15} />
              New Project
            </button>
          </>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Project Name
              </span>
              <input
                className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-800 border border-gray-600 rounded-md placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="MyJavaProject"
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Description
              </span>
              <input
                className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-800 border border-gray-600 rounded-md placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Optional"
              />
            </label>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
                type="submit"
              >
                Create
              </button>
              <button
                className="flex-1 py-2.5 text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-md transition-colors"
                type="button"
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
