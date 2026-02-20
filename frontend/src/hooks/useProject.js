import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";

function useProject() {
  const { token, authHeaders } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [activeContent, setActiveContent] = useState("");
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef(null);

  const API = "/api/projects";

  const headers = useCallback(() => authHeaders(), [authHeaders]);

  const listProjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(API, { headers: headers() });
      if (res.ok) setProjects(await res.json());
    } catch (_) {}
  }, [token, headers]);

  const createProject = useCallback(
    async (name, description) => {
      const res = await fetch(API, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await listProjects();
      return data;
    },
    [headers, listProjects],
  );

  const loadProject = useCallback(
    async (id) => {
      if (!id) {
        setCurrentProject(null);
        setActiveFile(null);
        setActiveContent("");
        return null;
      }
      const res = await fetch(`${API}/${id}`, { headers: headers() });
      if (!res.ok) throw new Error("Failed to load project");
      const proj = await res.json();
      setCurrentProject(proj);
      if (proj.lastOpenedFile) {
        const node = findFileInTree(proj.tree, proj.lastOpenedFile);
        if (node) {
          setActiveFile(proj.lastOpenedFile);
          setActiveContent(node.content || "");
        }
      }
      return proj;
    },
    [headers],
  );

  const deleteProject = useCallback(
    async (id) => {
      await fetch(`${API}/${id}`, { method: "DELETE", headers: headers() });
      if (currentProject && currentProject._id === id) {
        setCurrentProject(null);
        setActiveFile(null);
        setActiveContent("");
      }
      await listProjects();
    },
    [headers, currentProject, listProjects],
  );

  const selectFile = useCallback(
    (path, content) => {
      setActiveFile(path);
      setActiveContent(content || "");
      if (currentProject) {
        fetch(`${API}/${currentProject._id}`, {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({ lastOpenedFile: path }),
        }).catch(() => {});
      }
    },
    [currentProject, headers],
  );

  const saveFile = useCallback(
    async (path, content) => {
      if (!currentProject) return;
      setSaving(true);
      try {
        await fetch(`${API}/${currentProject._id}/tree/file`, {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify({ path, content }),
        });
      } finally {
        setSaving(false);
      }
    },
    [currentProject, headers],
  );

  const debouncedSave = useCallback(
    (path, content) => {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveFile(path, content), 800);
    },
    [saveFile],
  );

  const updateContent = useCallback(
    (content) => {
      setActiveContent(content);
      if (activeFile && currentProject) {
        updateTreeContent(currentProject.tree, activeFile, content);
        debouncedSave(activeFile, content);
      }
    },
    [activeFile, currentProject, debouncedSave],
  );

  const createFile = useCallback(
    async (parentPath, name) => {
      if (!currentProject) return;
      const filePath = parentPath ? `${parentPath}/${name}` : name;
      const res = await fetch(`${API}/${currentProject._id}/tree/file`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ path: filePath, content: "" }),
      });
      if (res.ok) {
        const proj = await res.json();
        setCurrentProject(proj);
        setActiveFile(filePath);
        setActiveContent("");
      }
    },
    [currentProject, headers],
  );

  const createFolder = useCallback(
    async (parentPath, name) => {
      if (!currentProject) return;
      const folderPath = parentPath ? `${parentPath}/${name}` : name;
      const res = await fetch(`${API}/${currentProject._id}/tree/folder`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ path: folderPath }),
      });
      if (res.ok) setCurrentProject(await res.json());
    },
    [currentProject, headers],
  );

  const deleteNode = useCallback(
    async (path) => {
      if (!currentProject) return;
      const res = await fetch(`${API}/${currentProject._id}/tree/node`, {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({ path }),
      });
      if (res.ok) {
        const proj = await res.json();
        setCurrentProject(proj);
        if (activeFile === path || activeFile?.startsWith(path + "/")) {
          setActiveFile(null);
          setActiveContent("");
        }
      }
    },
    [currentProject, activeFile, headers],
  );

  const renameNode = useCallback(
    async (path, newName) => {
      if (!currentProject) return;
      const res = await fetch(`${API}/${currentProject._id}/tree/rename`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ path, newName }),
      });
      if (res.ok) setCurrentProject(await res.json());
    },
    [currentProject, headers],
  );

  const setMainClass = useCallback(
    async (path) => {
      if (!currentProject) return;
      const res = await fetch(`${API}/${currentProject._id}`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ mainClassPath: path }),
      });
      if (res.ok) setCurrentProject(await res.json());
    },
    [currentProject, headers],
  );

  const exportZip = useCallback(async () => {
    if (!currentProject) return;
    const res = await fetch(`/api/export/${currentProject._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProject.name}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentProject, token]);

  useEffect(() => {
    listProjects();
  }, [listProjects]);

  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current);
  }, []);

  return {
    projects,
    currentProject,
    activeFile,
    activeContent,
    saving,
    listProjects,
    createProject,
    loadProject,
    deleteProject,
    selectFile,
    updateContent,
    createFile,
    createFolder,
    deleteNode,
    renameNode,
    setMainClass,
    exportZip,
  };
}

function findFileInTree(nodes, targetPath) {
  const segments = targetPath.split("/").filter(Boolean);
  let current = nodes;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const node = current.find((n) => n.name === seg);
    if (!node) return null;
    if (i === segments.length - 1) return node;
    if (node.kind !== "folder" || !node.children) return null;
    current = node.children;
  }
  return null;
}

function updateTreeContent(nodes, targetPath, content) {
  const node = findFileInTree(nodes, targetPath);
  if (node) node.content = content;
}

export default useProject;
