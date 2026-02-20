import { useState, useRef, useCallback } from "react";
import {
  Terminal as TerminalIcon,
  FileOutput,
  ChevronUp,
  ChevronDown,
  X,
  Trash2,
  Maximize2,
  Minimize2,
} from "lucide-react";

const TABS = [
  { id: "terminal", label: "TERMINAL", Icon: TerminalIcon },
  { id: "output", label: "OUTPUT", Icon: FileOutput },
];

function BottomPanel({ output, visible, onToggle, onClear }) {
  const [activeTab, setActiveTab] = useState("terminal");
  const [isMaximized, setIsMaximized] = useState(false);
  const [height, setHeight] = useState(200);
  const dragRef = useRef(null);

  const handleDragStart = useCallback(
    (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = height;
      const onMove = (ev) => {
        const delta = startY - ev.clientY;
        setHeight(Math.max(100, Math.min(600, startH + delta)));
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [height],
  );

  if (!visible) return null;

  const panelHeight = isMaximized ? "100%" : `${height}px`;

  return (
    <div
      className="flex flex-col bg-gray-800 border-t border-gray-700 shrink-0"
      style={{ height: panelHeight, minHeight: "100px" }}
    >
      {/* Drag handle */}
      <div
        className="h-1 cursor-ns-resize hover:bg-blue-500/50 transition-colors"
        onMouseDown={handleDragStart}
      />

      {/* Tab bar */}
      <div className="flex items-center h-9 px-2 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-0">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
                activeTab === id
                  ? "text-gray-200 border-b border-blue-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            className="p-1 text-gray-500 hover:text-gray-300 rounded-sm transition-colors"
            onClick={onClear}
            title="Clear"
          >
            <Trash2 size={13} />
          </button>
          <button
            className="p-1 text-gray-500 hover:text-gray-300 rounded-sm transition-colors"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            className="p-1 text-gray-500 hover:text-gray-300 rounded-sm transition-colors"
            onClick={onToggle}
            title="Close Panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-3 font-mono text-[13px] leading-relaxed">
        {activeTab === "terminal" || activeTab === "output" ? (
          output && output.length > 0 ? (
            output.map((line, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap ${
                  line.type === "error" || line.type === "stderr"
                    ? "text-red-400"
                    : line.type === "system"
                      ? "text-gray-500 italic"
                      : "text-gray-300"
                }`}
              >
                {line.text || line}
              </div>
            ))
          ) : (
            <p className="text-gray-600 italic">
              No output yet. Run your program to see results.
            </p>
          )
        ) : null}
      </div>
    </div>
  );
}

export default BottomPanel;
