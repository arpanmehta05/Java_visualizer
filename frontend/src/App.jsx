import { useState, useCallback, useEffect, useMemo } from "react";
import { ThemeProvider } from "./themes/ThemeContext";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import useProject from "./hooks/useProject";
import MonacoEditor from "./components/MonacoEditor";
import AuthPage from "./components/AuthPage";
import ProjectSelector from "./components/ProjectSelector";
import { IDELayout } from "./components/ide";
import useWebSocket from "./hooks/useWebSocket";
import useExecution from "./hooks/useExecution";
import { v4 as uuidv4 } from "uuid";
import "./styles/tailwind.css";

const DEFAULT_CODE = [
  "public class Main {",
  "    public static void main(String[] args) {",
  "        int x = 10;",
  "        int y = 20;",
  "        int sum = x + y;",
  '        System.out.println("Sum = " + sum);',
  "    }",
  "}",
].join("\n");

/* ── helpers ──────────────────────────────────────────── */
/** Flatten project tree into a list of file nodes with paths */
function collectFiles(nodes, prefix = "") {
  const result = [];
  if (!nodes) return result;
  for (const n of nodes) {
    const path = prefix ? `${prefix}/${n.name}` : n.name;
    if (n.type === "folder") {
      result.push(...collectFiles(n.children, path));
    } else {
      result.push({ name: n.name, path });
    }
  }
  return result;
}

/* ── WorkspaceApp ─────────────────────────────────────── */
function WorkspaceApp() {
  const { user, token, logout } = useAuth();
  const {
    projects,
    currentProject,
    activeFile,
    activeContent,
    saving,
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
  } = useProject();

  const [guestCode, setGuestCode] = useState(DEFAULT_CODE);

  /* ── Collaboration ─────────────────────────────────── */
  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("room") || null;
  });

  const handleJoinRoom = useCallback(() => {
    const id = uuidv4();
    setRoomId(id);
    const url = new URL(window.location);
    url.searchParams.set("room", id);
    window.history.pushState({}, "", url);
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setRoomId(null);
    const url = new URL(window.location);
    url.searchParams.delete("room");
    window.history.pushState({}, "", url);
  }, []);

  /* ── WebSocket & Execution ─────────────────────────── */
  const { sessionId, isConnected, lastMessage } = useWebSocket(
    "ws://localhost:3001/ws",
  );
  const {
    frames,
    currentStep,
    setCurrentStep,
    status,
    output,
    error,
    execute,
    isPlaying,
    togglePlay,
    stepForward,
    stepBackward,
    reset,
    playSpeed,
    setPlaySpeed,
  } = useExecution(lastMessage);

  const currentFrame = frames[currentStep - 1] || null;

  const isProjectMode = !!currentProject;
  const displayCode = isProjectMode ? activeContent : guestCode;

  /* ── Run handler ───────────────────────────────────── */
  const handleRun = useCallback(() => {
    if (!isConnected || status === "running") return;
    if (isProjectMode && currentProject) {
      fetch("/api/execute/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: currentProject._id,
          sessionId,
        }),
      }).catch(() => {});
    } else {
      execute(displayCode, sessionId);
    }
  }, [
    displayCode,
    sessionId,
    isConnected,
    status,
    execute,
    isProjectMode,
    currentProject,
    token,
  ]);

  const handleCodeChange = useCallback(
    (val) => {
      if (isProjectMode) {
        updateContent(val);
      } else {
        setGuestCode(val);
      }
    },
    [isProjectMode, updateContent],
  );

  /* ── Keyboard shortcuts ────────────────────────────── */
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "F5" || (e.ctrlKey && e.key === "Enter")) {
        e.preventDefault();
        handleRun();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRun]);

  /* ── Tabs state ────────────────────────────────────── */
  const [openTabs, setOpenTabs] = useState([]);

  const handleFileSelect = useCallback(
    (node) => {
      selectFile(node.path || node.name);
      setOpenTabs((prev) => {
        if (prev.find((t) => t.path === (node.path || node.name))) return prev;
        return [...prev, { name: node.name, path: node.path || node.name }];
      });
    },
    [selectFile],
  );

  const handleTabSelect = useCallback(
    (path) => {
      selectFile(path);
    },
    [selectFile],
  );

  const handleTabClose = useCallback(
    (path) => {
      setOpenTabs((prev) => {
        const next = prev.filter((t) => t.path !== path);
        if (activeFile === path && next.length > 0) {
          selectFile(next[next.length - 1].path);
        }
        return next;
      });
    },
    [activeFile, selectFile],
  );

  /* ── Combined output list ──────────────────────────── */
  const outputLines = useMemo(() => {
    const lines = [];
    if (output) {
      for (const o of output) {
        lines.push(typeof o === "string" ? { text: o, type: "stdout" } : o);
      }
    }
    if (error) {
      lines.push({ text: error, type: "error" });
    }
    return lines;
  }, [output, error]);

  /* ── Auth gates ────────────────────────────────────── */
  if (!user) return <AuthPage />;
  if (!currentProject) {
    return (
      <ProjectSelector
        projects={projects}
        onSelect={(id) => loadProject(id)}
        onCreate={createProject}
        onDelete={deleteProject}
      />
    );
  }

  return (
    <IDELayout
      /* Auth */
      userName={user.username}
      onLogout={logout}
      /* Connection / status */
      isConnected={isConnected}
      status={status}
      saving={saving}
      /* Collaboration */
      roomId={roomId}
      onJoinRoom={handleJoinRoom}
      onLeaveRoom={handleLeaveRoom}
      /* Execution */
      onRun={handleRun}
      onDebug={handleRun}
      output={outputLines}
      /* File tree */
      fileTree={currentProject.tree}
      activeFile={activeFile}
      projectName={currentProject.name}
      tabs={openTabs}
      onFileSelect={handleFileSelect}
      onTabSelect={handleTabSelect}
      onTabClose={handleTabClose}
      onNewFile={(parentPath) => {
        const name = prompt("File name:");
        if (name) createFile(parentPath, name);
      }}
      onNewFolder={(parentPath) => {
        const name = prompt("Folder name:");
        if (name) createFolder(parentPath, name);
      }}
      onDeleteFile={deleteNode}
      onRefresh={() => loadProject(currentProject._id)}
      onProjectsClick={() => loadProject(null)}
      /* Debugger data */
      frames={currentFrame ? currentFrame.callStack : []}
      variables={currentFrame ? currentFrame.variables : {}}
      heapData={currentFrame ? currentFrame.heap : {}}
      /* Playback */
      currentStep={currentStep}
      totalSteps={frames.length}
      isPlaying={isPlaying}
      playbackSpeed={playSpeed}
      onPlay={togglePlay}
      onPause={togglePlay}
      onStepForward={stepForward}
      onStepBack={stepBackward}
      onReset={reset}
      onSeek={setCurrentStep}
      onSpeedChange={setPlaySpeed}
    >
      {/* Monaco editor rendered inside EditorArea children slot */}
      {activeFile ? (
        <MonacoEditor
          code={displayCode}
          onChange={handleCodeChange}
          onRun={handleRun}
          activeLine={currentFrame ? currentFrame.line : null}
          readOnly={status === "running"}
          roomId={roomId}
          userName={user?.username}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-600">
          <div className="text-center">
            <p className="text-lg mb-1">No file open</p>
            <p className="text-sm">
              Select a file from the explorer to begin editing
            </p>
          </div>
        </div>
      )}
    </IDELayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
