import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Input,
  DatePicker,
  Tag,
  Progress,
  Button,
  Popconfirm,
  Modal,
  Typography,
  Space,
  Row,
  Col,
} from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { adminAPI } from "../../../api";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function ScoreRing({ label, value, color }) {
  return (
    <Col span={8} style={{ textAlign: "center" }}>
      <Progress
        type="circle"
        percent={Math.round(value || 0)}
        size={64}
        strokeColor={color}
      />
      <div style={{ marginTop: "6px", color: "#708c91" }}>{label}</div>
    </Col>
  );
}

function UserDetailModal({ user, onClose }) {
  if (!user) return null;
  return (
    <Modal open={!!user} onCancel={onClose} onOk={onClose} title={user.name}>
      <Text type="secondary">{user.email}</Text>
      <div style={{ margin: "8px 0 20px" }}>
        {(user.roles || []).map((role) => (
          <Tag key={role} color="blue">
            {role}
          </Tag>
        ))}
      </div>
      <Row gutter={[16, 16]}>
        <ScoreRing label="Trust" value={user.trustScore} color="#52c41a" />
        <ScoreRing
          label="Reliability"
          value={user.reliabilityScore}
          color="#00aff5"
        />
        <ScoreRing label="Comfort" value={user.comfortScore} color="#faad14" />
      </Row>
      <div style={{ marginTop: "20px" }}>
        <Text strong>Total CO₂ saved: </Text>
        <Text>{(user.totalCarbonSavedKg || 0).toFixed(1)} kg</Text>
      </div>
    </Modal>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [joinedRange, setJoinedRange] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      setUsers(res?.data || res || []);
      setError("");
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteUser(id);
      loadUsers();
    } catch (err) {
      Modal.error({
        title: "Delete failed",
        content: err.response?.data?.message || "Could not delete this user.",
      });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchText ||
        u.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchText.toLowerCase());

      const matchesDate =
        !joinedRange ||
        !joinedRange[0] ||
        !joinedRange[1] ||
        (dayjs(u.createdAt).isAfter(joinedRange[0].startOf("day")) &&
          dayjs(u.createdAt).isBefore(joinedRange[1].endOf("day")));

      return matchesSearch && matchesDate;
    });
  }, [users, searchText, joinedRange]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    { title: "Email", dataIndex: "email" },
    { title: "Phone", dataIndex: "phone" },
    {
      title: "Role",
      dataIndex: "roles",
      render: (roles) => (roles || []).map((r) => <Tag key={r}>{r}</Tag>),
    },
    {
      title: "Joined Date",
      dataIndex: "createdAt",
      sorter: (a, b) =>
        dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Trust",
      dataIndex: "trustScore",
      sorter: (a, b) => a.trustScore - b.trustScore,
      render: (v) => v?.toFixed(0),
    },
    {
      title: "Reliability",
      dataIndex: "reliabilityScore",
      sorter: (a, b) => a.reliabilityScore - b.reliabilityScore,
      render: (v) => v?.toFixed(0),
    },
    {
      title: "Comfort",
      dataIndex: "comfortScore",
      sorter: (a, b) => a.comfortScore - b.comfortScore,
      render: (v) => v?.toFixed(0),
    },
    {
      title: "Carbon Saved",
      dataIndex: "totalCarbonSavedKg",
      sorter: (a, b) => a.totalCarbonSavedKg - b.totalCarbonSavedKg,
      render: (v) => `${(v || 0).toFixed(1)} kg`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => setViewingUser(record)}
          />
          <Popconfirm
            title="Delete this user?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ color: "#054752" }}>
        User Management
      </Title>

      <Space style={{ marginBottom: "16px" }} wrap>
        <Input.Search
          placeholder="Search by name or email"
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 260 }}
        />
        <RangePicker
          onChange={setJoinedRange}
          placeholder={["Joined from", "Joined to"]}
        />
      </Space>

      {error && <Text type="danger">{error}</Text>}

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filteredUsers}
        scroll={{ x: "max-content" }}
      />

      <UserDetailModal
        user={viewingUser}
        onClose={() => setViewingUser(null)}
      />
    </div>
  );
}
