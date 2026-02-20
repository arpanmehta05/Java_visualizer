const Y = require("yjs");
const syncProtocol = require("y-protocols/sync");
const awarenessProtocol = require("y-protocols/awareness");
const encoding = require("lib0/encoding");
const decoding = require("lib0/decoding");
const map = require("lib0/map");

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

const rooms = new Map();

function getOrCreateRoom(roomId) {
  return map.setIfUndefined(rooms, roomId, () => {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    const conns = new Map();

    awareness.on("update", ({ added, updated, removed }, origin) => {
      const changedClients = added.concat(updated, removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients),
      );
      const buf = encoding.toUint8Array(encoder);
      conns.forEach((_, ws) => {
        if (ws.readyState === 1) ws.send(buf);
      });
    });

    doc.on("update", (update, origin) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const buf = encoding.toUint8Array(encoder);
      conns.forEach((_, ws) => {
        if (ws !== origin && ws.readyState === 1) ws.send(buf);
      });
    });

    return { doc, awareness, conns };
  });
}

function handleConnection(ws, roomId) {
  const room = getOrCreateRoom(roomId);
  room.conns.set(ws, new Set());

  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MSG_SYNC);
  syncProtocol.writeSyncStep1(syncEncoder, room.doc);
  ws.send(encoding.toUint8Array(syncEncoder));

  const awarenessStates = room.awareness.getStates();
  if (awarenessStates.size > 0) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(
        room.awareness,
        Array.from(awarenessStates.keys()),
      ),
    );
    ws.send(encoding.toUint8Array(encoder));
  }

  ws.on("message", (data) => {
    try {
      const buf =
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : new Uint8Array(data);
      const decoder = decoding.createDecoder(buf);
      const msgType = decoding.readVarUint(decoder);

      if (msgType === MSG_SYNC) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        syncProtocol.readSyncMessage(decoder, encoder, room.doc, ws);
        if (encoding.length(encoder) > 1) {
          ws.send(encoding.toUint8Array(encoder));
        }
      } else if (msgType === MSG_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(
          room.awareness,
          decoding.readVarUint8Array(decoder),
          ws,
        );
      }
    } catch (_) {}
  });

  ws.on("close", () => {
    room.conns.delete(ws);
    awarenessProtocol.removeAwarenessStates(
      room.awareness,
      [room.doc.clientID],
      null,
    );
    if (room.conns.size === 0) {
      room.awareness.destroy();
      room.doc.destroy();
      rooms.delete(roomId);
    }
  });
}

function setupCollabWss() {
  const { WebSocketServer } = require("ws");
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws, roomId) => {
    handleConnection(ws, roomId);
  });

  process.stdout.write("[JDI-Visualizer] Collab WebSocket server active\n");
  return wss;
}

module.exports = { setupCollabWss };
