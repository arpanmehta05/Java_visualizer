import { useRef, useEffect, useCallback } from "react";
import { useTheme } from "../themes/ThemeContext";
import { themeToMonacoRules } from "../themes/definitions";

let monacoInstance = null;

function getMonaco() {
  return monacoInstance;
}

/* ── helpers ── */
function findMainLines(model) {
  const lines = model.getLinesContent();
  const hits = [];
  const re = /public\s+static\s+void\s+main\s*\(/;
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) hits.push(i + 1); // 1-based
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
}) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const activeLineDecosRef = useRef([]);
  const breakpointDecosRef = useRef([]);
  const breakpointsRef = useRef(new Set());
  const codeLensProviderRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
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
        value: code,
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

      /* ── keyboard shortcuts ── */
      // Ctrl+Enter / Cmd+Enter
      editor.addAction({
        id: "jdi-run",
        label: "Run Code",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => onRunRef.current && onRunRef.current(),
      });
      // F5
      editor.addAction({
        id: "jdi-run-f5",
        label: "Run Code (F5)",
        keybindings: [monaco.KeyCode.F5],
        run: () => onRunRef.current && onRunRef.current(),
      });

      /* ── CodeLens: "▶ Run | 🐛 Debug" above main() ── */
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
                command: {
                  id: "jdi-codelens-run",
                  title: "▶ Run",
                },
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
                  title: "🔍 Debug",
                },
              });
            }
            return { lenses, dispose() {} };
          },
        },
      );

      /* register codelens commands (only once, idempotent) */
      try {
        editor.addCommand(
          0,
          () => onRunRef.current && onRunRef.current(),
          "jdi-codelens-run",
        );
      } catch (_) {}

      /* ── click gutter → toggle breakpoint ── */
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

      editor.onDidChangeModelContent(() => {
        if (onChangeRef.current) {
          onChangeRef.current(editor.getValue());
        }
      });

      editorRef.current = editor;
    }

    init();

    return () => {
      disposed = true;
      if (codeLensProviderRef.current) {
        codeLensProviderRef.current.dispose();
        codeLensProviderRef.current = null;
      }
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const current = editor.getValue();
    if (current !== code) {
      const pos = editor.getPosition();
      editor.setValue(code || "");
      if (pos) editor.setPosition(pos);
    }
  }, [code]);

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
