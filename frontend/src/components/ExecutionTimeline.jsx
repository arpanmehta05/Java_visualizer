function ExecutionTimeline({
  totalSteps,
  currentStep,
  onStepChange,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onReset,
  playSpeed,
  onSpeedChange,
  status,
}) {
  const disabled = totalSteps === 0;
  const speedOptions = [
    { label: "0.25x", value: 2000 },
    { label: "0.5x", value: 1000 },
    { label: "1x", value: 500 },
    { label: "2x", value: 250 },
    { label: "4x", value: 125 },
  ];

  return (
    <div className="timeline-container">
      <div className="timeline-controls">
        <button
          className="timeline-btn"
          onClick={onReset}
          disabled={disabled}
          title="Reset"
        >
          &#9198;
        </button>
        <button
          className="timeline-btn"
          onClick={onStepBackward}
          disabled={disabled || currentStep <= 1}
          title="Step Back"
        >
          &#9664;
        </button>
        <button
          className="timeline-btn timeline-btn-play"
          onClick={onTogglePlay}
          disabled={disabled}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "\u23F8" : "\u25B6"}
        </button>
        <button
          className="timeline-btn"
          onClick={onStepForward}
          disabled={disabled || currentStep >= totalSteps}
          title="Step Forward"
        >
          &#9654;
        </button>
      </div>

      <input
        type="range"
        className="timeline-slider"
        min={totalSteps > 0 ? 1 : 0}
        max={totalSteps || 1}
        value={currentStep}
        onChange={(e) => onStepChange(parseInt(e.target.value, 10))}
        disabled={disabled}
      />

      <div className="timeline-info">
        <span className="timeline-step">
          {currentStep}/{totalSteps}
        </span>
      </div>

      <div className="speed-control">
        <span className="speed-label">Speed</span>
        <select
          className="speed-select"
          value={playSpeed}
          onChange={(e) => onSpeedChange(parseInt(e.target.value, 10))}
        >
          {speedOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {status === "running" && (
        <div className="timeline-running-indicator">
          <span className="status-dot running" />
          <span>Collecting frames...</span>
        </div>
      )}
    </div>
  );
}

export default ExecutionTimeline;
