import { useState, useCallback, useEffect } from "react";
import { ThemeProvider } from "./themes/ThemeContext";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import useProject from "./hooks/useProject";
import MonacoEditor from "./components/MonacoEditor";
import SplitPane from "./components/SplitPane";
import FileExplorer from "./components/FileExplorer";
import CallStackView from "./components/CallStackView";
import MemoryView from "./components/MemoryView";
import HeapGraph from "./components/HeapGraph";
import ExecutionTimeline from "./components/ExecutionTimeline";
import OutputConsole from "./components/OutputConsole";
import ExampleSelector from "./components/ExampleSelector";
import ThemeSwitcher from "./components/ThemeSwitcher";
import AuthPage from "./components/AuthPage";
import ProjectSelector from "./components/ProjectSelector";
import CollabLink from "./components/CollabLink";
import useWebSocket from "./hooks/useWebSocket";
import useExecution from "./hooks/useExecution";
import "./styles/global.css";

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

const TABS = ["variables", "heap"];

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
  const [activeTab, setActiveTab] = useState("variables");

  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("room") || null;
  });

  const handleJoinRoom = useCallback((id) => {
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

  const handleExampleSelect = useCallback(
    (example) => {
      if (isProjectMode) {
        updateContent(example.code);
      } else {
        setGuestCode(example.code);
      }
    },
    [isProjectMode, updateContent],
  );

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
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">{"\u2B21"}</span>
          <span className="logo-text">JDI Visualizer</span>
          <span className="logo-badge">v3.0</span>
        </div>

        <div className="header-controls">
          <button className="btn" onClick={() => loadProject(null)}>
            Projects
          </button>
          <ExampleSelector onSelect={handleExampleSelect} />
          <ThemeSwitcher />
          <CollabLink
            roomId={roomId}
            onJoinRoom={handleJoinRoom}
            onLeaveRoom={handleLeaveRoom}
          />

          <div className="header-status">
            <span
              className={`status-dot ${
                status === "running"
                  ? "running"
                  : isConnected
                    ? "connected"
                    : "disconnected"
              }`}
            />
            <span className="status-label">
              {status === "running"
                ? "Executing"
                : isConnected
                  ? "Connected"
                  : "Offline"}
            </span>
            {saving && (
              <span
                className="status-label"
                style={{ color: "var(--accent-amber)" }}
              >
                Saving...
              </span>
            )}
          </div>

          <button
            className="btn btn-execute"
            onClick={handleRun}
            disabled={!isConnected || status === "running"}
          >
            <span className="btn-icon">{"\u25B6"}</span>
            {status === "running" ? "Running\u2026" : "Execute"}
          </button>

          <span
            className="ps-username"
            style={{ fontSize: 11, color: "var(--text-muted)" }}
          >
            {user.username}
          </span>
          <button className="btn" onClick={logout} style={{ fontSize: 10 }}>
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        <SplitPane
          direction="horizontal"
          defaultSplit={18}
          minPct={12}
          maxPct={30}
        >
          <div className="panel panel-explorer">
            <FileExplorer
              tree={currentProject.tree}
              activeFile={activeFile}
              mainClassPath={currentProject.mainClassPath}
              onSelectFile={selectFile}
              onCreateFile={createFile}
              onCreateFolder={createFolder}
              onDeleteNode={deleteNode}
              onRenameNode={renameNode}
              onSetMainClass={setMainClass}
              projectName={currentProject.name}
              onExport={exportZip}
            />
          </div>

          <SplitPane
            direction="horizontal"
            defaultSplit={58}
            minPct={30}
            maxPct={80}
          >
            <SplitPane
              direction="vertical"
              defaultSplit={70}
              minPct={40}
              maxPct={90}
            >
              <div className="panel panel-editor">
                <div className="panel-header">
                  <span className="panel-title">
                    {activeFile || "No file selected"}
                  </span>
                  <span className="panel-badge">Java</span>
                </div>
                <div className="panel-body panel-body--editor">
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
                    <div className="empty-state">
                      <div className="empty-state-icon">{"\u{1F4C2}"}</div>
                      <div>Select a file from the explorer</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="panel panel-output">
                <OutputConsole output={output} error={error} />
              </div>
            </SplitPane>

            <SplitPane
              direction="vertical"
              defaultSplit={45}
              minPct={20}
              maxPct={80}
            >
              <div className="panel panel-callstack">
                <div className="panel-header">
                  <span className="panel-title">Call Stack</span>
                  <span className="panel-badge">
                    {currentFrame ? currentFrame.callStack.length : 0} frames
                  </span>
                </div>
                <div className="panel-body">
                  <CallStackView
                    frames={currentFrame ? currentFrame.callStack : []}
                  />
                </div>
              </div>

              <div className="panel panel-tabbed">
                <div className="panel-header panel-tabs">
                  {TABS.map((t) => (
                    <button
                      key={t}
                      className={`tab-btn${activeTab === t ? " tab-btn--active" : ""}`}
                      onClick={() => setActiveTab(t)}
                    >
                      {t === "variables"
                        ? `Variables (${
                            currentFrame
                              ? Object.keys(currentFrame.variables || {})
                                  .length +
                                Object.keys(currentFrame.statics || {}).length
                              : 0
                          })`
                        : "Heap Graph"}
                    </button>
                  ))}
                </div>
                <div className="panel-body">
                  {activeTab === "variables" && (
                    <MemoryView
                      variables={currentFrame ? currentFrame.variables : {}}
                      statics={currentFrame ? currentFrame.statics : {}}
                      heap={currentFrame ? currentFrame.heap : {}}
                    />
                  )}
                  {activeTab === "heap" && (
                    <HeapGraph heap={currentFrame ? currentFrame.heap : {}} />
                  )}
                </div>
              </div>
            </SplitPane>
          </SplitPane>
        </SplitPane>
      </main>

      <footer className="app-footer">
        <div className="footer-timeline">
          <ExecutionTimeline
            totalSteps={frames.length}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onStepForward={stepForward}
            onStepBackward={stepBackward}
            onReset={reset}
            playSpeed={playSpeed}
            onSpeedChange={setPlaySpeed}
            status={status}
          />
        </div>
      </footer>
    </div>
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
