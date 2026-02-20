import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  FolderOpen,
  Folder,
  Plus,
  FolderPlus,
  Trash2,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";

function TreeNode({ node, depth = 0, activeFile, onFileSelect, onAction }) {
  const [expanded, setExpanded] = useState(true);
  const isFolder = node.type === "folder";
  const isActive = !isFolder && activeFile === node.path;

  const handleClick = () => {
    if (isFolder) {
      setExpanded(!expanded);
    } else {
      onFileSelect(node);
    }
  };

  return (
    <div>
      <button
        className={`flex items-center w-full text-left py-0.5 pr-2 text-[13px] transition-colors group ${
          isActive
            ? "bg-gray-600/50 text-gray-100"
            : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onAction?.("context", node);
        }}
      >
        {isFolder ? (
          expanded ? (
            <ChevronDown size={14} className="shrink-0 mr-0.5 text-gray-500" />
          ) : (
            <ChevronRight size={14} className="shrink-0 mr-0.5 text-gray-500" />
          )
        ) : (
          <span className="w-3.5 shrink-0 mr-0.5" />
        )}

        {isFolder ? (
          expanded ? (
            <FolderOpen
              size={15}
              className="shrink-0 mr-1.5 text-amber-400/80"
            />
          ) : (
            <Folder size={15} className="shrink-0 mr-1.5 text-amber-400/80" />
          )
        ) : (
          <File size={15} className="shrink-0 mr-1.5 text-blue-400/70" />
        )}

        <span className="truncate">{node.name}</span>

        {isFolder && (
          <div className="ml-auto hidden group-hover:flex items-center gap-0.5">
            <button
              className="p-0.5 hover:bg-gray-600 rounded-sm"
              onClick={(e) => {
                e.stopPropagation();
                onAction?.("newFile", node);
              }}
              title="New File"
            >
              <Plus size={13} />
            </button>
            <button
              className="p-0.5 hover:bg-gray-600 rounded-sm"
              onClick={(e) => {
                e.stopPropagation();
                onAction?.("newFolder", node);
              }}
              title="New Folder"
            >
              <FolderPlus size={13} />
            </button>
          </div>
        )}
      </button>

      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path || child.name}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExplorerSidebar({
  fileTree,
  activeFile,
  projectName,
  onFileSelect,
  onNewFile,
  onNewFolder,
  onDeleteFile,
  onRefresh,
  visible,
}) {
  if (!visible) return null;

  const handleAction = (action, node) => {
    switch (action) {
      case "newFile":
        onNewFile?.(node.path);
        break;
      case "newFolder":
        onNewFolder?.(node.path);
        break;
      case "delete":
        onDeleteFile?.(node.path);
        break;
      default:
        break;
    }
  };

  const rootNodes = fileTree || [];

  return (
    <aside className="flex flex-col w-60 bg-gray-800 border-r border-gray-700 shrink-0 overflow-hidden">
      <div className="flex items-center justify-between h-9 px-4 border-b border-gray-700">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Explorer
        </span>
        <div className="flex items-center gap-0.5">
          <button
            className="p-1 text-gray-500 hover:text-gray-300 rounded-sm transition-colors"
            onClick={onRefresh}
            title="Refresh Explorer"
          >
            <RefreshCw size={13} />
          </button>
          <button
            className="p-1 text-gray-500 hover:text-gray-300 rounded-sm transition-colors"
            onClick={() => onNewFile?.("")}
            title="New File"
          >
            <Plus size={13} />
          </button>
          <button
            className="p-1 text-gray-500 hover:text-gray-300 rounded-sm transition-colors"
            onClick={() => onNewFolder?.("")}
            title="New Folder"
          >
            <FolderPlus size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {projectName && (
          <div className="flex items-center px-3 py-1.5">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wide truncate">
              {projectName}
            </span>
          </div>
        )}
        {rootNodes.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-gray-500 mb-2">No files yet</p>
            <button
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              onClick={() => onNewFile?.("")}
            >
              Create a file
            </button>
          </div>
        ) : (
          rootNodes.map((node) => (
            <TreeNode
              key={node.path || node.name}
              node={node}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              onAction={handleAction}
            />
          ))
        )}
      </div>
    </aside>
  );
}

export default ExplorerSidebar;
