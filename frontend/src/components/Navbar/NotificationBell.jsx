import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Dropdown, Button, List, Typography, Empty } from "antd";
import { BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { notificationAPI } from "../../../api";

const { Text } = Typography;

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationAPI.getUnreadCount(userId);
      setUnreadCount(res?.data ?? 0);
    } catch {
      // Non-critical: badge just won't update this cycle.
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getByUser(userId);
      setNotifications(res?.data || []);
    } catch {
      // Non-critical.
    }
  };

  useEffect(() => {
    if (!userId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (next) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await notificationAPI.markRead(notification.id);
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    setOpen(false);
    if (notification.relatedRideId) {
      navigate(`/rides/${notification.relatedRideId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead(userId);
      setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const dropdownContent = (
    <div
      style={{
        width: "340px",
        maxHeight: "400px",
        overflowY: "auto",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        border: "1px solid #eef0f2",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid #eef0f2",
        }}
      >
        <Text strong style={{ color: "#054752" }}>
          Notifications
        </Text>
        <Button
          type="link"
          size="small"
          onClick={handleMarkAllRead}
          style={{ padding: 0 }}
        >
          Mark all read
        </Button>
      </div>
      {notifications.length > 0 ? (
        <List
          dataSource={notifications}
          renderItem={(n) => (
            <List.Item
              onClick={() => handleNotificationClick(n)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                background: n.read ? "transparent" : "rgba(0,175,245,0.04)",
              }}
            >
              <div style={{ width: "100%" }}>
                <Text strong style={{ color: "#054752", fontSize: "0.9rem" }}>
                  {n.title}
                </Text>
                <div style={{ fontSize: "0.82rem", color: "#708c91" }}>
                  {n.message}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#a3b1b5",
                    marginTop: "2px",
                  }}
                >
                  {n.createdAt
                    ? dayjs(n.createdAt).format("DD MMM, HH:mm")
                    : ""}
                </div>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description="No notifications yet"
          style={{ padding: "24px 0" }}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      popupRender={() => dropdownContent}
      trigger={["click"]}
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={
            <BellOutlined style={{ fontSize: "1.2rem", color: "#054752" }} />
          }
        />
      </Badge>
    </Dropdown>
  );
}
