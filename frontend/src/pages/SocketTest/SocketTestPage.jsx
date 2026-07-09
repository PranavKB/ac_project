/* eslint-disable max-lines-per-function */
import { useState, useEffect, useRef } from "react";
import { socketService } from "../../socket/socketService";
import { messageAPI } from "../../../api";
import "./SocketTestPage.scss";

const STATUS = {
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
  DISCONNECTED: "disconnected",
};

export default function SocketTestPage() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [rideId, setRideId] = useState("1");
  const [message, setMessage] = useState("");
  const [sender, setSender] = useState("TestUser");
  const [log, setLog] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [subscribedRideId, setSubscribedRideId] = useState(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const addLog = (type, text, data = null) => {
    setLog((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type,
        text,
        data,
        ts: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleConnect = () => {
    if (socketService.isConnected()) {
      addLog("warn", "Already connected.");
      return;
    }
    setStatus(STATUS.CONNECTING);
    addLog("info", "Activating STOMP client...");
    socketService.connect();

    const poll = setInterval(() => {
      if (socketService.isConnected()) {
        clearInterval(poll);
        setStatus(STATUS.CONNECTED);
        addLog("success", "Connected to STOMP broker.");
      }
    }, 300);

    setTimeout(() => {
      clearInterval(poll);
      if (!socketService.isConnected()) {
        setStatus(STATUS.ERROR);
        addLog("error", "Connection timed out after 10 s.");
      }
    }, 10000);
  };

  const handleDisconnect = () => {
    if (subscription) {
      socketService.unsubscribe(subscription);
      setSubscription(null);
      setSubscribedRideId(null);
      addLog("info", `Unsubscribed from ride ${subscribedRideId}.`);
    }
    socketService.disconnect();
    setStatus(STATUS.DISCONNECTED);
    addLog("warn", "Disconnected.");
  };

  const handleSubscribe = () => {
    if (!socketService.isConnected()) {
      addLog("error", "Not connected. Connect first.");
      return;
    }
    if (subscription) {
      socketService.unsubscribe(subscription);
      addLog("info", `Unsubscribed from previous ride ${subscribedRideId}.`);
    }
    const id = rideId.trim();
    if (!id) {
      addLog("error", "Enter a Ride ID.");
      return;
    }

    const sub = socketService.subscribeToChat(id, (msg) => {
      const senderName = msg.senderName ?? msg.sender ?? "??";
      const messageText = msg.messageText ?? msg.content ?? JSON.stringify(msg);
      addLog("message", `[ride:${id}] ${senderName}: ${messageText}`, msg);
    });

    setSubscription(sub);
    setSubscribedRideId(id);
    addLog("success", `Subscribed to /topic/chat/${id}`);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!socketService.isConnected()) {
      addLog("error", "Not connected.");
      return;
    }
    if (!subscribedRideId) {
      addLog("error", "Subscribe to a ride first.");
      return;
    }
    const content = message.trim();
    if (!content) return;

    const payload = {
      senderName: sender.trim() || "TestUser",
      senderId: "test-sender-id",
      messageText: content,
      rideId: subscribedRideId,
    };

    try {
      addLog("info", `Sending message via API...`);
      const sentMsg = await messageAPI.send(payload);
      addLog(
        "sent",
        `Sent -> [ride:${subscribedRideId}] "${sentMsg.messageText}"`,
        sentMsg,
      );
      setMessage("");
    } catch (err) {
      addLog("error", `Failed to send message: ${err.message}`, err);
    }
  };

  const handleClear = () => setLog([]);

  const statusLabel = {
    [STATUS.IDLE]: { text: "IDLE", color: "#4b5563" },
    [STATUS.CONNECTING]: { text: "CONNECTING", color: "#b45309" },
    [STATUS.CONNECTED]: { text: "CONNECTED", color: "#16a34a" },
    [STATUS.ERROR]: { text: "ERROR", color: "#dc2626" },
    [STATUS.DISCONNECTED]: { text: "DISCONNECTED", color: "#dc2626" },
  }[status];

  return (
    <div className="st-page">
      <header>
        <div>
          <h1>Socket Test Console</h1>
          <p className="subtitle">Dev-only / WebSocket / STOMP</p>
        </div>
        <div className="badge" style={{ "--badge-color": statusLabel.color }}>
          {statusLabel.text}
        </div>
      </header>

      <main>
        {/* LEFT CONTROL PANEL */}
        <div className="panel">
          <section>
            <h2>1 . Connection</h2>
            <div className="btn-row">
              <button
                className="btn btn--success"
                onClick={handleConnect}
                disabled={
                  status === STATUS.CONNECTED || status === STATUS.CONNECTING
                }
              >
                Connect
              </button>
              <button
                className="btn btn--danger"
                onClick={handleDisconnect}
                disabled={status !== STATUS.CONNECTED}
              >
                Disconnect
              </button>
            </div>
          </section>

          <section>
            <h2>2 . Subscribe to Chat</h2>
            <label>Ride ID</label>
            <input
              value={rideId}
              onChange={(e) => setRideId(e.target.value)}
              placeholder="e.g. 42"
            />
            <button
              className="btn btn--primary"
              onClick={handleSubscribe}
              disabled={status !== STATUS.CONNECTED}
            >
              {subscription ? "Re-subscribe" : "Subscribe"}
            </button>
            {subscribedRideId && (
              <p className="hint">
                Active: <code>/topic/chat/{subscribedRideId}</code>
              </p>
            )}
          </section>

          <section>
            <h2>3 . Send Message</h2>
            <form onSubmit={handleSend}>
              <label>Sender</label>
              <input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Sender name"
              />
              <label>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                rows={3}
              />
              <button
                className="btn btn--primary"
                type="submit"
                disabled={status !== STATUS.CONNECTED || !subscribedRideId}
              >
                Send Message
              </button>
            </form>
          </section>
        </div>

        {/* RIGHT LOG PANEL */}
        <div className="panel log-panel">
          <div className="log-header">
            <h2>Event Log</h2>
            <button className="btn btn--ghost" onClick={handleClear}>
              Clear
            </button>
          </div>

          <div className="log-stream">
            {log.length === 0 && (
              <p className="empty">
                No events yet. Connect and subscribe to start.
              </p>
            )}
            {log.map((entry) => (
              <div key={entry.id} className={`log-entry entry--${entry.type}`}>
                <span>{entry.ts}</span>
                <p>{entry.text}</p>
                {entry.data && <pre>{JSON.stringify(entry.data, null, 2)}</pre>}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </main>
    </div>
  );
}
