function CallStackView({ frames }) {
  if (!frames || frames.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#9776;</div>
        <div>No active stack frames</div>
        <div className="empty-state-sub">
          Execute code to see the call stack
        </div>
      </div>
    );
  }

  return (
    <div className="callstack-container">
      {frames.map((frame, i) => {
        const depth = frames.length - 1 - i;
        const hue = 210 + depth * 18;
        const paramStr = frame.params
          ? Object.entries(frame.params)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")
          : "";

        return (
          <div
            key={`${frame.methodName}-${frame.line}-${i}`}
            className={`stack-frame${i === 0 ? " stack-frame-active" : ""}`}
            style={{
              borderLeftColor: `hsl(${Math.min(hue, 340)}, 65%, 58%)`,
              animationDelay: `${i * 30}ms`,
            }}
          >
            <div className="stack-frame-header">
              <span className="stack-frame-index">{frames.length - i}</span>
              <span className="stack-frame-method">{frame.methodName}</span>
              {paramStr && (
                <span className="stack-frame-params">({paramStr})</span>
              )}
            </div>
            <div className="stack-frame-location">
              {frame.className}
              <span className="stack-frame-line">:{frame.line}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CallStackView;
