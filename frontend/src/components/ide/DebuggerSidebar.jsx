import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Variable,
  Database,
  Eye,
} from "lucide-react";

/* ── Call Stack Section ───────────────────────────────── */
function CallStackSection({ frames, currentStep }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="flex flex-col border-b border-gray-700">
      <button
        className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200 hover:bg-gray-750 transition-colors shrink-0"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Layers size={13} className="text-blue-400/80" />
        Call Stack
        {frames && frames.length > 0 && (
          <span className="ml-auto text-[10px] text-gray-500 font-normal">
            {frames.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="overflow-y-auto max-h-48 px-1 pb-1">
          {frames && frames.length > 0 ? (
            frames.map((frame, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-1 text-[12px] rounded-sm ${
                  i === 0
                    ? "bg-amber-400/10 text-amber-300"
                    : "text-gray-400 hover:bg-gray-700/50"
                }`}
              >
                <span className="font-mono truncate">
                  {frame.methodName || frame.method || frame}
                </span>
                {frame.lineNumber != null && (
                  <span className="ml-auto text-[10px] text-gray-500 font-mono shrink-0">
                    :{frame.lineNumber}
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="px-3 py-2 text-[11px] text-gray-600 italic">
              Not running
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Variables Section ────────────────────────────────── */
function VariablesSection({ variables }) {
  const [expanded, setExpanded] = useState(true);

  const vars = variables || {};
  const entries = Object.entries(vars);

  return (
    <section className="flex flex-col border-b border-gray-700">
      <button
        className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200 hover:bg-gray-750 transition-colors shrink-0"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Variable size={13} className="text-purple-400/80" />
        Variables
        {entries.length > 0 && (
          <span className="ml-auto text-[10px] text-gray-500 font-normal">
            {entries.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="overflow-y-auto max-h-56 px-1 pb-1">
          {entries.length > 0 ? (
            entries.map(([name, value]) => (
              <div
                key={name}
                className="flex items-center gap-2 px-3 py-0.5 text-[12px] hover:bg-gray-700/50 rounded-sm"
              >
                <span className="text-blue-300 font-mono">{name}</span>
                <span className="text-gray-600">=</span>
                <span className="text-amber-300 font-mono truncate">
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
                </span>
              </div>
            ))
          ) : (
            <p className="px-3 py-2 text-[11px] text-gray-600 italic">
              No variables in scope
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Watch / Heap Section ─────────────────────────────── */
function HeapSection({ heapData }) {
  const [expanded, setExpanded] = useState(true);

  const entries = heapData ? Object.entries(heapData) : [];

  return (
    <section className="flex flex-col">
      <button
        className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200 hover:bg-gray-750 transition-colors shrink-0"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Database size={13} className="text-emerald-400/80" />
        Heap
        {entries.length > 0 && (
          <span className="ml-auto text-[10px] text-gray-500 font-normal">
            {entries.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="overflow-y-auto flex-1 px-1 pb-1">
          {entries.length > 0 ? (
            entries.map(([id, obj]) => (
              <div
                key={id}
                className="px-3 py-1 text-[12px] hover:bg-gray-700/50 rounded-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-mono text-[10px]">
                    @{id}
                  </span>
                  <span className="text-emerald-300 font-mono truncate">
                    {obj.type || "Object"}
                  </span>
                </div>
                {obj.fields &&
                  Object.entries(obj.fields).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center gap-2 pl-4 text-[11px]"
                    >
                      <span className="text-blue-300 font-mono">{k}</span>
                      <span className="text-gray-600">:</span>
                      <span className="text-amber-300 font-mono truncate">
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            ))
          ) : (
            <p className="px-3 py-2 text-[11px] text-gray-600 italic">
              No heap objects
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Main DebuggerSidebar ─────────────────────────────── */
function DebuggerSidebar({
  frames,
  variables,
  heapData,
  currentStep,
  visible,
}) {
  if (!visible) return null;

  return (
    <aside className="flex flex-col w-72 bg-gray-800 border-l border-gray-700 shrink-0 overflow-hidden">
      <div className="flex items-center h-9 px-4 border-b border-gray-700 shrink-0">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Debug
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <CallStackSection frames={frames} currentStep={currentStep} />
        <VariablesSection variables={variables} />
        <HeapSection heapData={heapData} />
      </div>
    </aside>
  );
}

export default DebuggerSidebar;
