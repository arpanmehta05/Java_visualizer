import { useState, useRef, useCallback, useEffect } from "react";

function SplitPane({
  direction = "horizontal",
  defaultSplit = 50,
  minPct = 15,
  maxPct = 85,
  children,
}) {
  const [split, setSplit] = useState(defaultSplit);
  const dragging = useRef(false);
  const containerRef = useRef(null);

  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      dragging.current = true;
      document.body.style.cursor =
        direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [direction],
  );

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pct;
      if (direction === "horizontal") {
        pct = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        pct = ((e.clientY - rect.top) / rect.height) * 100;
      }
      pct = Math.max(minPct, Math.min(maxPct, pct));
      setSplit(pct);
    }

    function onMouseUp() {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [direction, minPct, maxPct]);

  const isHoriz = direction === "horizontal";
  const childArr = Array.isArray(children) ? children : [children];

  return (
    <div
      ref={containerRef}
      className="split-pane"
      style={{ flexDirection: isHoriz ? "row" : "column" }}
    >
      <div
        className="split-pane-first"
        style={isHoriz ? { width: `${split}%` } : { height: `${split}%` }}
      >
        {childArr[0]}
      </div>
      <div
        className={`split-pane-handle ${isHoriz ? "split-handle-h" : "split-handle-v"}`}
        onMouseDown={onMouseDown}
      >
        <div className="split-handle-dot" />
      </div>
      <div
        className="split-pane-second"
        style={
          isHoriz ? { width: `${100 - split}%` } : { height: `${100 - split}%` }
        }
      >
        {childArr[1]}
      </div>
    </div>
  );
}

export default SplitPane;
