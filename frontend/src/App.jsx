import { useState, useCallback, useEffect } from "react";
import { ThemeProvider } from "./themes/ThemeContext";
import MonacoEditor from "./components/MonacoEditor";
import SplitPane from "./components/SplitPane";
import CallStackView from "./components/CallStackView";
import MemoryView from "./components/MemoryView";
import HeapGraph from "./components/HeapGraph";
import ExecutionTimeline from "./components/ExecutionTimeline";
import OutputConsole from "./components/OutputConsole";
import ExampleSelector from "./components/ExampleSelector";
import ThemeSwitcher from "./components/ThemeSwitcher";
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

/* ---------- bottom-right tab selector ---------- */
const TABS = ["variables", "heap"];

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [activeTab, setActiveTab] = useState("variables");

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

  const handleRun = useCallback(() => {
    if (!isConnected || status === "running") return;
    execute(code, sessionId);
  }, [code, sessionId, isConnected, status, execute]);

  const handleExampleSelect = useCallback((example) => {
    setCode(example.code);
  }, []);

  /* ── Global keyboard shortcut: F5 / Ctrl+Enter to run ── */
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

  return (
    <ThemeProvider>
      <div className="app">
        {/* ─── HEADER ─── */}
        <header className="app-header">
          <div className="logo">
            <span className="logo-icon">&#x2B21;</span>
            <span className="logo-text">JDI Visualizer</span>
            <span className="logo-badge">v2.0</span>
          </div>

          <div className="header-controls">
            <ExampleSelector onSelect={handleExampleSelect} />
            <ThemeSwitcher />

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
            </div>

            <button
              className="btn btn-execute"
              onClick={handleRun}
              disabled={!isConnected || status === "running"}
            >
              <span className="btn-icon">&#9654;</span>
              {status === "running" ? "Running\u2026" : "Execute"}
            </button>
          </div>
        </header>

        {/* ─── MAIN SPLIT-PANE AREA ─── */}
        <main className="app-main">
          <SplitPane
            direction="horizontal"
            defaultSplit={50}
            minPct={25}
            maxPct={75}
          >
            {/* LEFT: Code editor (top) + Output console (bottom) */}
            <SplitPane
              direction="vertical"
              defaultSplit={70}
              minPct={40}
              maxPct={90}
            >
              {/* Editor */}
              <div className="panel panel-editor">
                <div className="panel-header">
                  <span className="panel-title">Source Code</span>
                  <span className="panel-badge">Java</span>
                </div>
                <div className="panel-body panel-body--editor">
                  <MonacoEditor
                    code={code}
                    onChange={setCode}
                    onRun={handleRun}
                    activeLine={currentFrame ? currentFrame.line : null}
                    readOnly={status === "running"}
                  />
                </div>
              </div>

              {/* Output Console */}
              <div className="panel panel-output">
                <OutputConsole output={output} error={error} />
              </div>
            </SplitPane>

            {/* RIGHT: Call stack (top) + tabbed Variables/Heap (bottom) */}
            <SplitPane
              direction="vertical"
              defaultSplit={45}
              minPct={20}
              maxPct={80}
            >
              {/* TOP-RIGHT: Call Stack */}
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

              {/* BOTTOM-RIGHT: Tabbed panel (Variables / Heap) */}
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
        </main>

        {/* ─── FOOTER: Timeline + Output ─── */}
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
    </ThemeProvider>
  );
}

export default App;
