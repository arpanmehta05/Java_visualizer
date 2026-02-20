import { useState } from "react";
import Navbar from "./Navbar";
import ActivityBar from "./ActivityBar";
import ExplorerSidebar from "./ExplorerSidebar";
import EditorArea from "./EditorArea";
import BottomPanel from "./BottomPanel";
import DebuggerSidebar from "./DebuggerSidebar";
import PlaybackFooter from "./PlaybackFooter";

function IDELayout({
  /* Auth */
  userName,
  onLogout,

  /* Connection / status */
  isConnected,
  status,
  saving,

  /* Collaboration */
  roomId,
  onJoinRoom,
  onLeaveRoom,

  /* Execution */
  onRun,
  onDebug,
  output,

  /* File tree */
  fileTree,
  activeFile,
  projectName,
  tabs,
  onFileSelect,
  onTabSelect,
  onTabClose,
  onNewFile,
  onNewFolder,
  onDeleteFile,
  onRefresh,
  onProjectsClick,

  /* Debugger data */
  frames,
  variables,
  heapData,

  /* Playback */
  currentStep,
  totalSteps,
  isPlaying,
  playbackSpeed,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onSeek,
  onSpeedChange,

  /* Editor content — MonacoEditor rendered as children */
  children,
}) {
  const [activePanel, setActivePanel] = useState("explorer");
  const [bottomVisible, setBottomVisible] = useState(true);
  const [debugVisible, setDebugVisible] = useState(true);

  const showExplorer = activePanel === "explorer";
  const showDebug = activePanel === "debug" || debugVisible;

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-gray-300 overflow-hidden">
      {/* 1. Navbar */}
      <Navbar
        userName={userName}
        isConnected={isConnected}
        status={status}
        saving={saving}
        roomId={roomId}
        onRun={onRun}
        onDebug={onDebug}
        onLogout={onLogout}
        onJoinRoom={onJoinRoom}
        onLeaveRoom={onLeaveRoom}
        onProjectsClick={onProjectsClick}
      />

      {/* Main body: ActivityBar + Sidebars + Editor + Bottom */}
      <div className="flex flex-1 min-h-0">
        {/* 2. ActivityBar */}
        <ActivityBar
          activePanel={activePanel}
          onPanelChange={(panel) => {
            setActivePanel(panel);
            if (panel === "debug") setDebugVisible(true);
          }}
        />

        {/* 3. ExplorerSidebar */}
        <ExplorerSidebar
          visible={showExplorer}
          fileTree={fileTree}
          activeFile={activeFile}
          projectName={projectName}
          onFileSelect={onFileSelect}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          onDeleteFile={onDeleteFile}
          onRefresh={onRefresh}
        />

        {/* Center column: EditorArea + BottomPanel */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          {/* 4. EditorArea */}
          <EditorArea
            tabs={tabs}
            activeTab={activeFile}
            onTabSelect={onTabSelect}
            onTabClose={onTabClose}
          >
            {children}
          </EditorArea>

          {/* 5. BottomPanel */}
          <BottomPanel
            output={output}
            visible={bottomVisible}
            onToggle={() => setBottomVisible(!bottomVisible)}
            onClear={() => {}}
          />
        </div>

        {/* 6. DebuggerSidebar */}
        <DebuggerSidebar
          visible={showDebug}
          frames={frames}
          variables={variables}
          heapData={heapData}
          currentStep={currentStep}
        />
      </div>

      {/* 7. PlaybackFooter */}
      <PlaybackFooter
        visible={totalSteps > 0}
        currentStep={currentStep}
        totalSteps={totalSteps}
        isPlaying={isPlaying}
        speed={playbackSpeed}
        onPlay={onPlay}
        onPause={onPause}
        onStepForward={onStepForward}
        onStepBack={onStepBack}
        onReset={onReset}
        onSeek={onSeek}
        onSpeedChange={onSpeedChange}
      />
    </div>
  );
}

export default IDELayout;
