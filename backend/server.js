const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { WebSocketServer } = require("ws");
const DockerManager = require("./services/dockerManager");
const WSManager = require("./services/wsManager");
const preloaded = require("./examples/preloaded");
const snippetRoutes = require("./routes/snippets");
const preferencesRoutes = require("./routes/preferences");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const exportRoutes = require("./routes/export");
const { requireAuth } = require("./middleware/auth");
const Project = require("./models/Project");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/jdi-visualizer";
mongoose
  .connect(MONGO_URI)
  .then(() => process.stdout.write("[JDI-Visualizer] MongoDB connected\n"))
  .catch((err) =>
    process.stdout.write(`[JDI-Visualizer] MongoDB optional: ${err.message}\n`),
  );

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/snippets", snippetRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/export", exportRoutes);

const { setupCollabWss } = require("./services/collabServer");

const wss = new WebSocketServer({ noServer: true });
const wsManager = new WSManager(wss);
const dockerManager = new DockerManager();
const collabWss = setupCollabWss();

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/ws") {
    wss.handleUpgrade(req, socket, head, (ws) =>
      wss.emit("connection", ws, req),
    );
  } else if (url.pathname.startsWith("/collab/")) {
    const roomId = url.pathname.slice("/collab/".length);
    collabWss.handleUpgrade(req, socket, head, (ws) => {
      collabWss.emit("connection", ws, roomId);
    });
  } else {
    socket.destroy();
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/api/examples", (req, res) => {
  res.json(preloaded);
});

app.post("/api/execute", async (req, res) => {
  const { code, sessionId } = req.body;

  if (!code || !sessionId) {
    return res.status(400).json({ error: "Missing code or sessionId" });
  }

  const executionId =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  wsManager.send(sessionId, { type: "execution_start", executionId });

  try {
    await dockerManager.execute(code, (data) => {
      wsManager.send(sessionId, data);
    });
    wsManager.send(sessionId, { type: "execution_complete", executionId });
    res.json({ executionId, status: "completed" });
  } catch (error) {
    wsManager.send(sessionId, {
      type: "error",
      message: error.message || "Execution failed",
    });
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/execute/project", requireAuth, async (req, res) => {
  const { projectId, sessionId } = req.body;

  if (!projectId || !sessionId) {
    return res.status(400).json({ error: "Missing projectId or sessionId" });
  }

  const project = await Project.findOne({
    _id: projectId,
    ownerId: req.userId,
  });
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const executionId =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  wsManager.send(sessionId, { type: "execution_start", executionId });

  try {
    await dockerManager.executeProject(
      project.tree,
      project.mainClassPath,
      (data) => {
        wsManager.send(sessionId, data);
      },
    );
    wsManager.send(sessionId, { type: "execution_complete", executionId });
    res.json({ executionId, status: "completed" });
  } catch (error) {
    wsManager.send(sessionId, {
      type: "error",
      message: error.message || "Execution failed",
    });
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  process.stdout.write(`[JDI-Visualizer] Backend listening on port ${PORT}\n`);
});
