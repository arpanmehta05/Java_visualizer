import {
  Files,
  Search,
  GitBranch,
  Play,
  Puzzle,
  Settings,
  User,
} from "lucide-react";

const TOP_ICONS = [
  { id: "explorer", Icon: Files, label: "Explorer" },
  { id: "search", Icon: Search, label: "Search" },
  { id: "git", Icon: GitBranch, label: "Source Control" },
  { id: "debug", Icon: Play, label: "Run and Debug" },
  { id: "extensions", Icon: Puzzle, label: "Extensions" },
];

const BOTTOM_ICONS = [
  { id: "account", Icon: User, label: "Account" },
  { id: "settings", Icon: Settings, label: "Settings" },
];

function ActivityBar({ activePanel, onPanelChange }) {
  return (
    <aside className="flex flex-col items-center justify-between w-12 bg-gray-950 border-r border-gray-700 shrink-0 select-none">
      <div className="flex flex-col items-center w-full pt-1">
        {TOP_ICONS.map(({ id, Icon, label }) => {
          const isActive = activePanel === id;
          return (
            <button
              key={id}
              className={`relative flex items-center justify-center w-full h-12 transition-colors ${
                isActive ? "text-gray-100" : "text-gray-500 hover:text-gray-300"
              }`}
              onClick={() => onPanelChange(isActive ? null : id)}
              title={label}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gray-100 rounded-r" />
              )}
              <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center w-full pb-1">
        {BOTTOM_ICONS.map(({ id, Icon, label }) => (
          <button
            key={id}
            className="flex items-center justify-center w-full h-12 text-gray-500 hover:text-gray-300 transition-colors"
            title={label}
          >
            <Icon size={22} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </aside>
  );
}

export default ActivityBar;
