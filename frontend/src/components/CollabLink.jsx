import { useState, useCallback } from "react";

function generateRoomId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function CollabLink({ roomId, onJoinRoom, onLeaveRoom }) {
  const [copied, setCopied] = useState(false);

  const handleCreate = useCallback(() => {
    const id = generateRoomId();
    onJoinRoom(id);
  }, [onJoinRoom]);

  const handleCopy = useCallback(() => {
    if (!roomId) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomId]);

  if (!roomId) {
    return (
      <button className="btn btn-collab" onClick={handleCreate}>
        <span className="btn-icon">{"\u{1F517}"}</span>
        Live Share
      </button>
    );
  }

  return (
    <div className="collab-bar">
      <span className="collab-indicator" />
      <span className="collab-label">Room: {roomId.slice(0, 8)}&hellip;</span>
      <button className="collab-copy" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <button className="collab-leave" onClick={onLeaveRoom}>
        Leave
      </button>
    </div>
  );
}

export default CollabLink;
