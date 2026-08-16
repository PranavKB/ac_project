import { Card, Avatar, Typography, Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function TripChatCard({
  messages,
  user,
  newMessageText,
  setNewMessageText,
  handleSendMessage,
  sendingMessage,
}) {
  return (
    <Card
      title={
        <span style={{ color: "#054752", fontWeight: 700 }}>💬 Trip Chat</span>
      }
      style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
    >
      <div
        style={{
          maxHeight: "250px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: "16px",
          padding: "12px",
          border: "1px solid #eef0f2",
          borderRadius: "12px",
          background: "#f9fafb",
        }}
      >
        {messages.length > 0 ? (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.data?.id;
            return (
              <div
                key={msg.id || idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  flexDirection: isMe ? "row-reverse" : "row",
                }}
              >
                <Avatar
                  size="small"
                  style={{ backgroundColor: isMe ? "#00aff5" : "#8c8c8c" }}
                >
                  {(msg.senderName || "?").charAt(0).toUpperCase()}
                </Avatar>
                <div
                  style={{
                    background: isMe ? "#00aff5" : "#ffffff",
                    color: isMe ? "#ffffff" : "#054752",
                    padding: "8px 14px",
                    borderRadius: "12px",
                    border: isMe ? "none" : "1px solid #eef0f2",
                    maxWidth: "70%",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      marginBottom: "2px",
                      opacity: 0.8,
                    }}
                  >
                    {msg.senderName || "Unknown"}
                  </div>
                  <div style={{ fontSize: "0.9rem" }}>{msg.messageText}</div>
                </div>
              </div>
            );
          })
        ) : (
          <Text
            type="secondary"
            style={{ textAlign: "center", display: "block", padding: "16px 0" }}
          >
            No messages in chat yet.
          </Text>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <Input
          value={newMessageText}
          onChange={(e) => setNewMessageText(e.target.value)}
          placeholder="Type a message..."
          onPressEnter={handleSendMessage}
          style={{ borderRadius: "20px" }}
        />
        <Button
          type="primary"
          shape="circle"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          disabled={sendingMessage || !newMessageText.trim()}
        />
      </div>
    </Card>
  );
}
