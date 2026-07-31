import { useState } from "react";
import {
  Table,
  Input,
  Select,
  Button,
  Tag,
  Card,
  Empty,
  Typography,
  Space,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { notificationAPI, adminAPI } from "../../../api";

const { Title, Text } = Typography;

const TYPE_COLORS = {
  BOOKING_REQUESTED: "blue",
  REQUEST_APPROVED: "green",
  REQUEST_REJECTED: "red",
  RIDE_STARTED: "gold",
  RIDE_COMPLETED: "cyan",
  BACKUP_CANDIDATE_SUGGESTED: "purple",
};

const TYPE_OPTIONS = [
  { value: "ALL", label: "All types" },
  { value: "BOOKING_REQUESTED", label: "Booking Requested" },
  { value: "REQUEST_APPROVED", label: "Request Approved" },
  { value: "REQUEST_REJECTED", label: "Request Rejected" },
  { value: "RIDE_STARTED", label: "Ride Started" },
  { value: "RIDE_COMPLETED", label: "Ride Completed" },
  { value: "BACKUP_CANDIDATE_SUGGESTED", label: "Backup Candidate Suggested" },
];

const columns = [
  {
    title: "Type",
    dataIndex: "type",
    render: (type) => (
      <Tag color={TYPE_COLORS[type] || "default"}>
        {type ? type.replaceAll("_", " ") : "-"}
      </Tag>
    ),
  },
  { title: "Title", dataIndex: "title" },
  { title: "Message", dataIndex: "message" },
  {
    title: "Status",
    dataIndex: "read",
    render: (read) => (
      <Tag color={read ? "default" : "gold"}>{read ? "Read" : "Unread"}</Tag>
    ),
  },
  {
    title: "Related Ride",
    dataIndex: "relatedRideId",
    render: (rideId) => rideId || "-",
  },
  {
    title: "Created",
    dataIndex: "createdAt",
    defaultSortOrder: "descend",
    sorter: (a, b) =>
      dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    render: (date) => (date ? dayjs(date).format("DD MMM YYYY, HH:mm") : "-"),
  },
];

export default function AdminNotifications() {
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleFetch = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Enter a user email to fetch notifications.");
      return;
    }
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const usersRes = await adminAPI.getUsers();
      const users = usersRes?.data || usersRes || [];
      const matchedUser = users.find(
        (u) => u.email?.toLowerCase() === trimmedEmail,
      );
      if (!matchedUser) {
        setError("No user found with that email.");
        setNotifications([]);
        return;
      }
      const res = await notificationAPI.getByUser(matchedUser.id);
      setNotifications(res?.data || res || []);
    } catch {
      setError("Failed to fetch notifications for this email.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications =
    typeFilter === "ALL"
      ? notifications
      : notifications.filter((n) => n.type === typeFilter);

  return (
    <div>
      <Title level={3} style={{ color: "#054752" }}>
        Notifications
      </Title>

      <Space style={{ marginBottom: "16px" }} wrap>
        <Input
          placeholder="Enter user email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onPressEnter={handleFetch}
          style={{ width: 280 }}
          allowClear
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleFetch}
          loading={loading}
        >
          Fetch
        </Button>
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          options={TYPE_OPTIONS}
          style={{ width: 240 }}
        />
      </Space>

      {error && (
        <div style={{ marginBottom: "12px" }}>
          <Text type="danger">{error}</Text>
        </div>
      )}

      {searched ? (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredNotifications}
          scroll={{ x: "max-content" }}
        />
      ) : (
        <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
          <Empty description="Enter a user email above and click Fetch to view their notifications." />
        </Card>
      )}
    </div>
  );
}
