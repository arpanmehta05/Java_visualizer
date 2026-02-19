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

const wss = new WebSocketServer({ server, path: "/ws" });
const wsManager = new WSManager(wss);
const dockerManager = new DockerManager();

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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  process.stdout.write(`[JDI-Visualizer] Backend listening on port ${PORT}\n`);
});
