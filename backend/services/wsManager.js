class WSManager {
  constructor(wss) {
    this.sessions = new Map();

    wss.on("connection", (ws) => {
      let boundSessionId = null;

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw);
          if (msg.type === "register" && msg.sessionId) {
            if (boundSessionId) {
              this.sessions.delete(boundSessionId);
            }
            boundSessionId = msg.sessionId;
            this.sessions.set(boundSessionId, ws);
            ws.send(
              JSON.stringify({
                type: "registered",
                sessionId: boundSessionId,
              }),
            );
          }
        } catch (_) {}
      });

      ws.on("close", () => {
        if (boundSessionId) {
          this.sessions.delete(boundSessionId);
        }
      });

      ws.on("error", () => {
        if (boundSessionId) {
          this.sessions.delete(boundSessionId);
        }
      });
    });
  }

  send(sessionId, data) {
    const ws = this.sessions.get(sessionId);
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(data));
    }
  }
}

module.exports = WSManager;
