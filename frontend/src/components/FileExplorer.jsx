import { useState, useCallback, useMemo, useRef, useEffect } from "react";

function FileIcon({ name, kind, isMain }) {
  if (kind === "folder")
    return <span className="fe-icon fe-icon-folder">{"\uD83D\uDCC1"}</span>;
  if (isMain) return <span className="fe-icon fe-icon-main">{"\u25B6"}</span>;
  if (name.endsWith(".java"))
    return <span className="fe-icon fe-icon-java">J</span>;
  return <span className="fe-icon fe-icon-file">{"\uD83D\uDCC4"}</span>;
}

function InlineInput({ initialValue, onSubmit, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, []);

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      const v = ref.current.value.trim();
      if (v) onSubmit(v);
      else onCancel();
    }
    if (e.key === "Escape") onCancel();
  }

  return (
    <input
      ref={ref}
      className="fe-inline-input"
      defaultValue={initialValue}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        const v = ref.current?.value.trim();
        if (v) onSubmit(v);
        else onCancel();
      }}
    />
  );
}

function TreeNode({
  node,
  depth,
  path,
  activeFile,
  mainClassPath,
  expanded,
  onToggle,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  onSetMain,
}) {
  const [renaming, setRenaming] = useState(false);
  const [creating, setCreating] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const fullPath = path ? `${path}/${node.name}` : node.name;
  const isExpanded = expanded[fullPath];
  const isActive = activeFile === fullPath;
  const isMain = mainClassPath === fullPath;
  const isFolder = node.kind === "folder";

  const handleClick = useCallback(() => {
    if (isFolder) {
      onToggle(fullPath);
    } else {
      onSelect(fullPath, node.content);
    }
  }, [isFolder, fullPath, node.content, onToggle, onSelect]);

  const handleContext = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeCtx = useCallback(() => setContextMenu(null), []);

  const sorted = useMemo(() => {
    if (!isFolder || !node.children) return [];
    return [...node.children].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [isFolder, node.children]);

  return (
    <>
      <div
        className={`fe-row${isActive ? " fe-row--active" : ""}${isMain ? " fe-row--main" : ""}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={handleClick}
        onContextMenu={handleContext}
        title={fullPath}
      >
        {isFolder && (
          <span
            className={`fe-chevron${isExpanded ? " fe-chevron--open" : ""}`}
          >
            \u25B8
          </span>
        )}
        <FileIcon name={node.name} kind={node.kind} isMain={isMain} />
        {renaming ? (
          <InlineInput
            initialValue={node.name}
            onSubmit={(v) => {
              setRenaming(false);
              onRename(fullPath, v);
            }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <span className="fe-name">{node.name}</span>
        )}
        {isMain && <span className="fe-main-badge">main</span>}
      </div>

      {contextMenu && (
        <>
          <div className="fe-ctx-backdrop" onClick={closeCtx} />
          <div
            className="fe-ctx-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {isFolder && (
              <>
                <button
                  className="fe-ctx-item"
                  onClick={() => {
                    closeCtx();
                    setCreating("file");
                    if (!isExpanded) onToggle(fullPath);
                  }}
                >
                  New File
                </button>
                <button
                  className="fe-ctx-item"
                  onClick={() => {
                    closeCtx();
                    setCreating("folder");
                    if (!isExpanded) onToggle(fullPath);
                  }}
                >
                  New Folder
                </button>
                <div className="fe-ctx-divider" />
              </>
            )}
            {!isFolder && node.name.endsWith(".java") && (
              <>
                <button
                  className="fe-ctx-item"
                  onClick={() => {
                    closeCtx();
                    onSetMain(fullPath);
                  }}
                >
                  Set as Main Class
                </button>
                <div className="fe-ctx-divider" />
              </>
            )}
            <button
              className="fe-ctx-item"
              onClick={() => {
                closeCtx();
                setRenaming(true);
              }}
            >
              Rename
            </button>
            <button
              className="fe-ctx-item fe-ctx-item--danger"
              onClick={() => {
                closeCtx();
                onDelete(fullPath);
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}

      {isFolder && isExpanded && (
        <>
          {creating && (
            <div
              className="fe-row"
              style={{ paddingLeft: (depth + 1) * 16 + 8 }}
            >
              <FileIcon
                name={creating === "folder" ? "" : ".java"}
                kind={creating}
                isMain={false}
              />
              <InlineInput
                initialValue=""
                onSubmit={(v) => {
                  setCreating(null);
                  if (creating === "file") onCreateFile(fullPath, v);
                  else onCreateFolder(fullPath, v);
                }}
                onCancel={() => setCreating(null)}
              />
            </div>
          )}
          {sorted.map((child) => (
            <TreeNode
              key={child._id || child.name}
              node={child}
              depth={depth + 1}
              path={fullPath}
              activeFile={activeFile}
              mainClassPath={mainClassPath}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDelete={onDelete}
              onRename={onRename}
              onSetMain={onSetMain}
            />
          ))}
        </>
      )}
    </>
  );
}

function FileExplorer({
  tree,
  activeFile,
  mainClassPath,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onRenameNode,
  onSetMainClass,
  projectName,
  onExport,
}) {
  const [expanded, setExpanded] = useState(() => {
    const init = {};
    function expand(nodes, prefix) {
      for (const n of nodes) {
        if (n.kind === "folder") {
          const p = prefix ? `${prefix}/${n.name}` : n.name;
          init[p] = true;
          if (n.children) expand(n.children, p);
        }
      }
    }
    expand(tree, "");
    return init;
  });

  const [rootCreating, setRootCreating] = useState(null);

  const onToggle = useCallback((path) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  const sorted = useMemo(
    () =>
      [...tree].sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [tree],
  );

  return (
    <div className="fe-container">
      <div className="fe-header">
        <span className="fe-header-title">{projectName || "Explorer"}</span>
        <div className="fe-header-actions">
          <button
            className="fe-header-btn"
            title="New File"
            onClick={() => setRootCreating("file")}
          >
            {"+ \uD83D\uDCC4"}
          </button>
          <button
            className="fe-header-btn"
            title="New Folder"
            onClick={() => setRootCreating("folder")}
          >
            {"+ \uD83D\uDCC1"}
          </button>
          {onExport && (
            <button
              className="fe-header-btn"
              title="Export ZIP"
              onClick={onExport}
            >
              {"\uD83D\uDCE6"}
            </button>
          )}
        </div>
      </div>
      <div className="fe-tree">
        {rootCreating && (
          <div className="fe-row" style={{ paddingLeft: 8 }}>
            <FileIcon
              name={rootCreating === "folder" ? "" : ".java"}
              kind={rootCreating}
              isMain={false}
            />
            <InlineInput
              initialValue=""
              onSubmit={(v) => {
                setRootCreating(null);
                if (rootCreating === "file") onCreateFile("", v);
                else onCreateFolder("", v);
              }}
              onCancel={() => setRootCreating(null)}
            />
          </div>
        )}
        {sorted.map((node) => (
          <TreeNode
            key={node._id || node.name}
            node={node}
            depth={0}
            path=""
            activeFile={activeFile}
            mainClassPath={mainClassPath}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelectFile}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
            onDelete={onDeleteNode}
            onRename={onRenameNode}
            onSetMain={onSetMainClass}
          />
        ))}
        {sorted.length === 0 && !rootCreating && (
          <div className="fe-empty">No files yet</div>
        )}
      </div>
    </div>
  );
}

export default FileExplorer;
