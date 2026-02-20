import { useRef, useEffect, useCallback } from "react";
import { useTheme } from "../themes/ThemeContext";
import { themeToMonacoRules } from "../themes/definitions";

let monacoInstance = null;

function getMonaco() {
  return monacoInstance;
}

const COLLAB_COLORS = [
  "#60a5fa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
  "#fb923c",
  "#22d3ee",
  "#e879f9",
];

function pickColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

function findMainLines(model) {
  const lines = model.getLinesContent();
  const hits = [];
  const re = /public\s+static\s+void\s+main\s*\(/;
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) hits.push(i + 1);
  }
  return hits;
}

function MonacoEditor({
  code,
  onChange,
  onRun,
  activeLine,
  readOnly,
  language = "java",
  roomId,
  userName,
}) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const activeLineDecosRef = useRef([]);
  const breakpointDecosRef = useRef([]);
  const breakpointsRef = useRef(new Set());
  const codeLensProviderRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const collabRef = useRef(null);
  const { theme } = useTheme();

  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  const applyTheme = useCallback(
    (monaco) => {
      const rules = themeToMonacoRules(theme);
      monaco.editor.defineTheme("jdi-theme", rules);
      monaco.editor.setTheme("jdi-theme");
    },
    [theme],
  );

  /* ── render breakpoint glyphs ── */
  const refreshBreakpoints = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const decos = [...breakpointsRef.current].map((ln) => ({
      range: {
        startLineNumber: ln,
        startColumn: 1,
        endLineNumber: ln,
        endColumn: 1,
      },
      options: {
        isWholeLine: false,
        glyphMarginClassName: "breakpoint-dot",
        stickiness: 1,
      },
    }));
    breakpointDecosRef.current = editor.deltaDecorations(
      breakpointDecosRef.current,
      decos,
    );
  }, []);

  useEffect(() => {
    let disposed = false;

    async function init() {
      const monaco = await import("monaco-editor");
      if (disposed) return;
      monacoInstance = monaco;

      applyTheme(monaco);

      const editor = monaco.editor.create(containerRef.current, {
        value: roomId ? "" : code,
        language,
        theme: "jdi-theme",
        fontSize: 13,
        fontFamily: "var(--font-mono)",
        fontLigatures: true,
        lineHeight: 22,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 10, bottom: 10 },
        renderLineHighlight: "none",
        roundedSelection: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling: true,
        tabSize: 4,
        detectIndentation: false,
        fixedOverflowWidgets: true,
        folding: true,
        glyphMargin: true,
        lineNumbers: "on",
        lineNumbersMinChars: 4,
        readOnly: readOnly || false,
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        scrollbar: {
          vertical: "auto",
          horizontal: "auto",
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
          verticalSliderSize: 6,
          horizontalSliderSize: 6,
        },
      });

      editor.addAction({
        id: "jdi-run",
        label: "Run Code",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => onRunRef.current && onRunRef.current(),
      });

      editor.addAction({
        id: "jdi-run-f5",
        label: "Run Code (F5)",
        keybindings: [monaco.KeyCode.F5],
        run: () => onRunRef.current && onRunRef.current(),
      });

      codeLensProviderRef.current = monaco.languages.registerCodeLensProvider(
        "java",
        {
          provideCodeLenses(model) {
            const mainLines = findMainLines(model);
            const lenses = [];
            for (const ln of mainLines) {
              lenses.push({
                range: {
                  startLineNumber: ln,
                  startColumn: 1,
                  endLineNumber: ln,
                  endColumn: 1,
                },
                command: { id: "jdi-codelens-run", title: "\u25B6 Run" },
              });
              lenses.push({
                range: {
                  startLineNumber: ln,
                  startColumn: 1,
                  endLineNumber: ln,
                  endColumn: 1,
                },
                command: {
                  id: "jdi-codelens-debug",
                  title: "\uD83D\uDD0D Debug",
                },
              });
            }
            return { lenses, dispose() {} };
          },
        },
      );

      try {
        editor.addCommand(
          0,
          () => onRunRef.current && onRunRef.current(),
          "jdi-codelens-run",
        );
      } catch (_) {}

      editor.onMouseDown((e) => {
        if (
          e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
          e.target.type ===
            monaco.editor.MouseTargetType.GUTTER_LINE_DECORATIONS
        ) {
          const ln = e.target.position?.lineNumber;
          if (!ln) return;
          if (breakpointsRef.current.has(ln)) {
            breakpointsRef.current.delete(ln);
          } else {
            breakpointsRef.current.add(ln);
          }
          refreshBreakpoints();
        }
      });

      if (!roomId) {
        editor.onDidChangeModelContent(() => {
          if (onChangeRef.current) {
            onChangeRef.current(editor.getValue());
          }
        });
      }

      editorRef.current = editor;

      if (roomId) {
        await setupCollab(editor, roomId, userName);
      }
    }

    async function setupCollab(editor, room, name) {
      const Y = await import("yjs");
      const { WebsocketProvider } = await import("y-websocket");
      const { MonacoBinding } = await import("y-monaco");

      if (disposed) return;

      const ydoc = new Y.Doc();
      const wsUrl =
        (window.location.protocol === "https:" ? "wss://" : "ws://") +
        window.location.host +
        "/collab";
      const provider = new WebsocketProvider(wsUrl, room, ydoc, {
        connect: true,
      });

      const ytext = ydoc.getText("monaco");

      const displayName = name || "User-" + ydoc.clientID.toString(36);
      const color = pickColor(displayName);

      provider.awareness.setLocalStateField("user", {
        name: displayName,
        color,
      });

      const binding = new MonacoBinding(
        ytext,
        editor.getModel(),
        new Set([editor]),
        provider.awareness,
      );

      ytext.observe(() => {
        if (onChangeRef.current) {
          onChangeRef.current(editor.getValue());
        }
      });

      if (code && ytext.length === 0) {
        ydoc.transact(() => {
          ytext.insert(0, code);
        });
      }

      collabRef.current = { ydoc, provider, binding };
    }

    init();

    return () => {
      disposed = true;
      if (collabRef.current) {
        collabRef.current.binding.destroy();
        collabRef.current.provider.disconnect();
        collabRef.current.provider.destroy();
        collabRef.current.ydoc.destroy();
        collabRef.current = null;
      }
      if (codeLensProviderRef.current) {
        codeLensProviderRef.current.dispose();
        codeLensProviderRef.current = null;
      }
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [roomId]);

  useEffect(() => {
    if (!editorRef.current || roomId) return;
    const editor = editorRef.current;
    const current = editor.getValue();
    if (current !== code) {
      const pos = editor.getPosition();
      editor.setValue(code || "");
      if (pos) editor.setPosition(pos);
    }
  }, [code, roomId]);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.updateOptions({ readOnly: readOnly || false });
  }, [readOnly]);

  useEffect(() => {
    if (monacoInstance) applyTheme(monacoInstance);
  }, [applyTheme]);

  /* ── active execution line (subtle yellow arrow, NOT red) ── */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (activeLine && activeLine > 0) {
      activeLineDecosRef.current = editor.deltaDecorations(
        activeLineDecosRef.current,
        [
          {
            range: {
              startLineNumber: activeLine,
              startColumn: 1,
              endLineNumber: activeLine,
              endColumn: 1,
            },
            options: {
              isWholeLine: true,
              className: "jdi-exec-line",
              glyphMarginClassName: "jdi-exec-arrow",
            },
          },
        ],
      );
      editor.revealLineInCenter(activeLine);
    } else {
      activeLineDecosRef.current = editor.deltaDecorations(
        activeLineDecosRef.current,
        [],
      );
    }
  }, [activeLine]);

  return (
    <div
      ref={containerRef}
      className="monaco-container"
      style={{ width: "100%", height: "100%", minHeight: 0 }}
    />
  );
}

export { MonacoEditor as default, getMonaco };
