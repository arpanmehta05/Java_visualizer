import { useMemo } from "react";

function HeapGraph({ heap, variables, statics }) {
  const { nodes, edges } = useMemo(() => {
    if (!heap || Object.keys(heap).length === 0)
      return { nodes: [], edges: [] };

    const nodeMap = new Map();
    const edgeList = [];
    const entries = Object.entries(heap);

    entries.forEach(([refId, obj], i) => {
      const cols = Math.min(entries.length, 4);
      const row = Math.floor(i / cols);
      const col = i % cols;
      nodeMap.set(refId, {
        id: refId,
        x: 80 + col * 200,
        y: 50 + row * 140,
        type: obj.type || "Object",
        fields: obj.fields || null,
        elements: obj.elements || null,
      });
    });

    const allRefs = {};
    if (variables) {
      Object.entries(variables).forEach(([name, info]) => {
        if (info && info.id && nodeMap.has(info.id)) {
          allRefs[name] = info.id;
        }
      });
    }
    if (statics) {
      Object.entries(statics).forEach(([name, info]) => {
        if (info && info.id && nodeMap.has(info.id)) {
          allRefs[name] = info.id;
        }
      });
    }

    entries.forEach(([refId, obj]) => {
      if (obj.fields) {
        Object.entries(obj.fields).forEach(([fname, fval]) => {
          const targetId = Object.keys(heap).find(
            (k) => fval === k || fval === `@${k.replace("ref@", "")}`,
          );
          if (targetId && nodeMap.has(targetId)) {
            edgeList.push({ from: refId, to: targetId, label: fname });
          }
        });
      }
    });

    return { nodes: Array.from(nodeMap.values()), edges: edgeList };
  }, [heap, variables, statics]);

  if (nodes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#128200;</div>
        <div>No heap objects</div>
        <div className="empty-state-sub">
          Object references will appear here during execution
        </div>
      </div>
    );
  }

  const svgW = Math.max(
    600,
    nodes.reduce((m, n) => Math.max(m, n.x + 180), 0),
  );
  const svgH = Math.max(
    300,
    nodes.reduce((m, n) => Math.max(m, n.y + 120), 0),
  );

  return (
    <div className="heap-graph-container">
      <svg width={svgW} height={svgH} className="heap-graph-svg">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="var(--graph-edge-stroke)" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const from = nodes.find((n) => n.id === e.from);
          const to = nodes.find((n) => n.id === e.to);
          if (!from || !to) return null;
          const x1 = from.x + 70;
          const y1 = from.y + 35;
          const x2 = to.x + 70;
          const y2 = to.y + 35;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2 - 20;
          return (
            <g key={`edge-${i}`}>
              <path
                d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                fill="none"
                stroke="var(--graph-edge-stroke)"
                strokeWidth="1.5"
                markerEnd="url(#arrowhead)"
                opacity="0.7"
              />
              <text x={mx} y={my - 4} className="heap-graph-edge-label">
                {e.label}
              </text>
            </g>
          );
        })}

        {nodes.map((node) => {
          const isArray = !!node.elements;
          const boxW = isArray
            ? Math.max(140, node.elements.length * 34 + 10)
            : 140;
          const boxH = 70;
          return (
            <g key={node.id} className="heap-graph-node">
              <rect
                x={node.x}
                y={node.y}
                width={boxW}
                height={boxH}
                rx="4"
                fill="var(--graph-node-fill)"
                stroke="var(--graph-node-stroke)"
                strokeWidth="1.5"
              />
              <text
                x={node.x + 6}
                y={node.y + 14}
                className="heap-graph-type-label"
              >
                {node.type.length > 18
                  ? node.type.slice(0, 16) + ".."
                  : node.type}
              </text>
              <line
                x1={node.x}
                x2={node.x + boxW}
                y1={node.y + 20}
                y2={node.y + 20}
                stroke="var(--graph-node-stroke)"
                strokeWidth="0.5"
              />
              {isArray ? (
                node.elements.map((el, idx) => (
                  <g key={idx}>
                    <rect
                      x={node.x + 5 + idx * 34}
                      y={node.y + 26}
                      width="30"
                      height="34"
                      rx="2"
                      fill="var(--bg-elevated)"
                      stroke="var(--border-default)"
                      strokeWidth="0.5"
                    />
                    <text
                      x={node.x + 20 + idx * 34}
                      y={node.y + 37}
                      className="heap-graph-idx"
                    >
                      {idx}
                    </text>
                    <text
                      x={node.x + 20 + idx * 34}
                      y={node.y + 53}
                      className="heap-graph-val"
                    >
                      {String(el).length > 4
                        ? String(el).slice(0, 3) + ".."
                        : el}
                    </text>
                  </g>
                ))
              ) : node.fields ? (
                Object.entries(node.fields)
                  .slice(0, 3)
                  .map(([fn, fv], fi) => (
                    <text
                      key={fn}
                      x={node.x + 6}
                      y={node.y + 34 + fi * 13}
                      className="heap-graph-field"
                    >
                      <tspan fill="var(--accent-blue)">{fn}</tspan>
                      <tspan fill="var(--text-muted)">: </tspan>
                      <tspan fill="var(--accent-green)">
                        {String(fv).length > 14
                          ? String(fv).slice(0, 12) + ".."
                          : fv}
                      </tspan>
                    </text>
                  ))
              ) : (
                <text
                  x={node.x + 6}
                  y={node.y + 38}
                  className="heap-graph-field"
                >
                  {node.id}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default HeapGraph;
