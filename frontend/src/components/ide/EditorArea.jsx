import { X, MoreHorizontal } from "lucide-react";

function EditorArea({ tabs, activeTab, onTabSelect, onTabClose, children }) {
  const currentTabs = tabs || [];

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-gray-900 overflow-hidden">
      {/* Tab bar */}
      {currentTabs.length > 0 && (
        <div className="flex items-center h-9 bg-gray-800 border-b border-gray-700 overflow-x-auto shrink-0">
          {currentTabs.map((tab) => {
            const isActive = activeTab === tab.path;
            return (
              <button
                key={tab.path}
                className={`group flex items-center gap-1.5 px-3 h-full text-[13px] border-r border-gray-700 whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? "bg-gray-900 text-gray-200 border-t-2 border-t-blue-500"
                    : "bg-gray-800 text-gray-500 hover:text-gray-300 hover:bg-gray-750 border-t-2 border-t-transparent"
                }`}
                onClick={() => onTabSelect(tab.path)}
              >
                <span>{tab.name}</span>
                {tab.modified && (
                  <span className="w-2 h-2 rounded-full bg-gray-400 group-hover:hidden" />
                )}
                <span
                  className={`p-0.5 rounded-sm hover:bg-gray-600 transition-colors ${
                    tab.modified
                      ? "group-hover:inline-flex hidden"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.path);
                  }}
                >
                  <X size={12} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Editor content — MonacoEditor will be rendered as children */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export default EditorArea;
