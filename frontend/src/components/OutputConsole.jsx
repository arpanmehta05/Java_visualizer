import { useMemo } from "react";

function OutputConsole({ output, error }) {
  const lines = useMemo(() => {
    if (!output) return [];
    return output.split("\n").filter((l) => l.length > 0);
  }, [output]);

  const hasContent = lines.length > 0 || error;

  return (
    <div className="output-container">
      <div className="panel-header">
        <span className="panel-title">Output</span>
        {hasContent && (
          <span className="panel-badge">
            {error
              ? "error"
              : `${lines.length} line${lines.length !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>
      <div className="output-body">
        {error && <div className="output-error">{error}</div>}
        {lines.map((line, i) => (
          <div key={i} className="output-line">
            {line}
          </div>
        ))}
        {!hasContent && (
          <div className="output-placeholder">
            Program output will appear here
          </div>
        )}
      </div>
    </div>
  );
}

export default OutputConsole;
