import { useState } from "react";
import {
  Menu,
  ChevronDown,
  Play,
  Bug,
  Users,
  LogOut,
  Loader2,
} from "lucide-react";

const MENU_ITEMS = [
  "File",
  "Edit",
  "Selection",
  "View",
  "Run",
  "Terminal",
  "Help",
];

function Navbar({
  userName,
  isConnected,
  status,
  saving,
  roomId,
  onRun,
  onDebug,
  onLogout,
  onJoinRoom,
  onLeaveRoom,
  onProjectsClick,
}) {
  const [activeMenu, setActiveMenu] = useState(null);

  return (
    <header className="flex items-center h-10 bg-gray-800 border-b border-gray-700 select-none shrink-0 z-20">
      <div className="flex items-center gap-0.5 px-2">
        {MENU_ITEMS.map((item) => (
          <button
            key={item}
            className={`px-2.5 py-1 text-xs rounded-sm transition-colors ${
              activeMenu === item
                ? "bg-gray-600 text-gray-100"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
            }`}
            onClick={() => setActiveMenu(activeMenu === item ? null : item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mx-auto">
        <button
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-200 bg-green-700 hover:bg-green-600 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onRun}
          disabled={!isConnected || status === "running"}
        >
          {status === "running" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Play size={13} fill="currentColor" />
          )}
          {status === "running" ? "Running..." : "Run"}
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-200 bg-orange-700 hover:bg-orange-600 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onDebug}
          disabled={!isConnected || status === "running"}
        >
          <Bug size={13} />
          Debug
        </button>
      </div>

      <div className="flex items-center gap-2 px-3">
        {saving && (
          <span className="text-[10px] text-amber-400 font-medium">
            Saving...
          </span>
        )}

        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === "running"
                ? "bg-amber-400 animate-pulse"
                : isConnected
                  ? "bg-emerald-400"
                  : "bg-red-400"
            }`}
          />
          <span className="text-[10px] text-gray-500">
            {status === "running"
              ? "Executing"
              : isConnected
                ? "Connected"
                : "Offline"}
          </span>
        </div>

        {roomId ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-700 rounded-sm border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-mono">
              {roomId.slice(0, 8)}
            </span>
            <button
              className="text-[10px] text-gray-500 hover:text-gray-200 pl-1"
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
                navigator.clipboard.writeText(url);
              }}
            >
              Copy
            </button>
            <button
              className="text-[10px] text-gray-500 hover:text-red-400 pl-0.5"
              onClick={onLeaveRoom}
            >
              Leave
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600 rounded-sm transition-colors"
            onClick={onJoinRoom}
          >
            <Users size={12} />
            Live Share
          </button>
        )}

        <span className="text-[11px] text-gray-500 font-medium pl-1">
          {userName}
        </span>
        <button
          className="p-1 text-gray-500 hover:text-gray-300 rounded-sm transition-colors"
          onClick={onLogout}
          title="Logout"
        >
          <LogOut size={13} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
