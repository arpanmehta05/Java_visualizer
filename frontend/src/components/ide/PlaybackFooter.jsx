import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
} from "lucide-react";

const SPEEDS = [
  { value: 0.5, label: "0.5x" },
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 4, label: "4x" },
];

function PlaybackFooter({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onSeek,
  onSpeedChange,
  visible,
}) {
  if (!visible) return null;

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <footer className="flex items-center h-8 bg-gray-950 border-t border-gray-700 px-3 shrink-0 select-none">
      {/* Playback controls */}
      <div className="flex items-center gap-1">
        <button
          className="p-1 text-gray-400 hover:text-gray-200 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={onReset}
          disabled={totalSteps === 0}
          title="Reset"
        >
          <RotateCcw size={13} />
        </button>
        <button
          className="p-1 text-gray-400 hover:text-gray-200 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={onStepBack}
          disabled={currentStep <= 0}
          title="Step Back"
        >
          <SkipBack size={13} />
        </button>
        <button
          className="p-1.5 text-gray-200 bg-blue-600 hover:bg-blue-500 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={isPlaying ? onPause : onPlay}
          disabled={totalSteps === 0}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={13} fill="currentColor" />
          ) : (
            <Play size={13} fill="currentColor" />
          )}
        </button>
        <button
          className="p-1 text-gray-400 hover:text-gray-200 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={onStepForward}
          disabled={currentStep >= totalSteps}
          title="Step Forward"
        >
          <SkipForward size={13} />
        </button>
      </div>

      {/* Timeline */}
      <div className="flex items-center flex-1 mx-4 gap-2">
        <span className="text-[10px] font-mono text-gray-500 w-8 text-right shrink-0">
          {currentStep}
        </span>
        <div className="relative flex-1 h-1 bg-gray-700 rounded-full cursor-pointer group">
          <div
            className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            min={0}
            max={totalSteps}
            value={currentStep}
            onChange={(e) => onSeek(Number(e.target.value))}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full border-2 border-gray-950 shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
          />
        </div>
        <span className="text-[10px] font-mono text-gray-500 w-8 shrink-0">
          {totalSteps}
        </span>
      </div>

      {/* Speed control */}
      <div className="flex items-center gap-1">
        <Gauge size={12} className="text-gray-500" />
        {SPEEDS.map((s) => (
          <button
            key={s.value}
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-colors ${
              speed === s.value
                ? "bg-blue-600 text-gray-100"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-700"
            }`}
            onClick={() => onSpeedChange(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </footer>
  );
}

export default PlaybackFooter;
