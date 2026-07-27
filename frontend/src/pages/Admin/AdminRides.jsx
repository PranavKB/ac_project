import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Input,
  DatePicker,
  Tag,
  Button,
  Popconfirm,
  Modal,
  Typography,
  Space,
  Descriptions,
} from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { adminAPI } from "../../../api";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLORS = {
  ACTIVE: "blue",
  ONGOING: "gold",
  COMPLETED: "green",
  CANCELLED: "red",
};

function RideDetailModal({ ride, onClose }) {
  if (!ride) return null;
  return (
    <Modal open={!!ride} onCancel={onClose} onOk={onClose} title="Ride Details">
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Driver">{ride.driverName}</Descriptions.Item>
        <Descriptions.Item label="Source">{ride.sourceName}</Descriptions.Item>
        <Descriptions.Item label="Destination">
          {ride.destinationName}
        </Descriptions.Item>
        <Descriptions.Item label="Departure">
          {ride.departureTime
            ? dayjs(ride.departureTime).format("DD MMM YYYY, HH:mm")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Seats">
          {ride.availableSeats} / {ride.totalSeats}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLORS[ride.status]}>{ride.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {ride.createdAt
            ? dayjs(ride.createdAt).format("DD MMM YYYY, HH:mm")
            : "-"}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default function AdminRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [createdRange, setCreatedRange] = useState(null);
  const [viewingRide, setViewingRide] = useState(null);

  const loadRides = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getRides();
      setRides(res?.data || res || []);
      setError("");
    } catch {
      setError("Failed to load rides.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRides();
  }, []);

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteRide(id);
      loadRides();
    } catch (err) {
      Modal.error({
        title: "Delete failed",
        content: err.response?.data?.message || "Could not delete this ride.",
      });
    }
  };

  const filteredRides = useMemo(() => {
    return rides.filter((r) => {
      const haystack =
        `${r.driverName} ${r.sourceName} ${r.destinationName}`.toLowerCase();
      const matchesSearch =
        !searchText || haystack.includes(searchText.toLowerCase());

      const matchesDate =
        !createdRange ||
        !createdRange[0] ||
        !createdRange[1] ||
        (dayjs(r.createdAt).isAfter(createdRange[0].startOf("day")) &&
          dayjs(r.createdAt).isBefore(createdRange[1].endOf("day")));

      return matchesSearch && matchesDate;
    });
  }, [rides, searchText, createdRange]);

  const columns = [
    {
      title: "Driver",
      dataIndex: "driverName",
      sorter: (a, b) => (a.driverName || "").localeCompare(b.driverName || ""),
    },
    { title: "Source", dataIndex: "sourceName" },
    { title: "Destination", dataIndex: "destinationName" },
    {
      title: "Departure Time",
      dataIndex: "departureTime",
      sorter: (a, b) =>
        dayjs(a.departureTime).valueOf() - dayjs(b.departureTime).valueOf(),
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY, HH:mm") : "-"),
    },
    {
      title: "Available Seats",
      dataIndex: "availableSeats",
      sorter: (a, b) => a.availableSeats - b.availableSeats,
      render: (v, record) => `${v} / ${record.totalSeats}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: [
        { text: "Active", value: "ACTIVE" },
        { text: "Ongoing", value: "ONGOING" },
        { text: "Completed", value: "COMPLETED" },
        { text: "Cancelled", value: "CANCELLED" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => <Tag color={STATUS_COLORS[status]}>{status}</Tag>,
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      sorter: (a, b) =>
        dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => setViewingRide(record)}
          />
          <Popconfirm
            title="Delete this ride?"
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
        Ride Management
      </Title>

      <Space style={{ marginBottom: "16px" }} wrap>
        <Input.Search
          placeholder="Search by driver, source, or destination"
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280 }}
        />
        <RangePicker
          onChange={setCreatedRange}
          placeholder={["Created from", "Created to"]}
        />
      </Space>

      {error && <Text type="danger">{error}</Text>}

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filteredRides}
        scroll={{ x: "max-content" }}
      />

      <RideDetailModal
        ride={viewingRide}
        onClose={() => setViewingRide(null)}
      />
    </div>
  );
}
