import { useRef, useCallback, useMemo } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-java";

function CodeEditor({ code, onChange, activeLine, readOnly }) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const gutterRef = useRef(null);

  const highlighted = useMemo(
    () => Prism.highlight(code || "", Prism.languages.java, "java"),
    [code],
  );

  const lines = useMemo(() => (code || "").split("\n"), [code]);

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const hl = highlightRef.current;
    const gt = gutterRef.current;
    if (!ta) return;
    if (hl) {
      hl.scrollTop = ta.scrollTop;
      hl.scrollLeft = ta.scrollLeft;
    }
    if (gt) {
      gt.scrollTop = ta.scrollTop;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (readOnly) return;
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.target;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        const updated = val.substring(0, start) + "    " + val.substring(end);
        onChange(updated);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 4;
        });
      }
    },
    [onChange, readOnly],
  );

  const activeLineTop =
    activeLine !== null && activeLine > 0 ? (activeLine - 1) * 22 + 12 : -100;

  return (
    <div className="editor-container">
      <div className="editor-gutter" ref={gutterRef}>
        {lines.map((_, i) => (
          <div
            key={i}
            className={`line-number${activeLine === i + 1 ? " active" : ""}`}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div className="editor-content">
        {activeLine !== null && activeLine > 0 && (
          <div
            className="active-line-highlight"
            style={{ top: activeLineTop }}
          />
        )}
        <pre className="editor-highlight-layer" ref={highlightRef}>
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          data-gramm="false"
        />
      </div>
    </div>
  );
}

export default CodeEditor;
