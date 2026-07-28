import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Input,
  Tag,
  Button,
  Popconfirm,
  Modal,
  Typography,
  Space,
  Descriptions,
} from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { adminAPI } from "../../../api";

const { Title, Text } = Typography;

const STATUS_COLORS = {
  PENDING: "gold",
  REVIEWED: "green",
  DISMISSED: "default",
};

function ReportDetailModal({ report, onClose }) {
  if (!report) return null;
  return (
    <Modal
      open={!!report}
      onCancel={onClose}
      onOk={onClose}
      title="Report Details"
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Ride">
          {report.rideSummary || report.rideId}
        </Descriptions.Item>
        <Descriptions.Item label="Reported by">
          {report.reporterName}
        </Descriptions.Item>
        <Descriptions.Item label="Reported user">
          {report.reportedUserName || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Reason">{report.reason}</Descriptions.Item>
        <Descriptions.Item label="Details">
          {report.details || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLORS[report.status]}>{report.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Submitted">
          {report.createdAt
            ? dayjs(report.createdAt).format("DD MMM YYYY, HH:mm")
            : "-"}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [viewingReport, setViewingReport] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReports();
      setReports(res?.data || res || []);
      setError("");
    } catch {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReports();
  }, []);

  const handleReview = async (id) => {
    try {
      await adminAPI.reviewReport(id);
      loadReports();
    } catch (err) {
      Modal.error({
        title: "Action failed",
        content: err.response?.data?.message || "Could not update this report.",
      });
    }
  };

  const handleDismiss = async (id) => {
    try {
      await adminAPI.dismissReport(id);
      loadReports();
    } catch (err) {
      Modal.error({
        title: "Action failed",
        content: err.response?.data?.message || "Could not update this report.",
      });
    }
  };

  const handleDeleteRide = async (rideId) => {
    try {
      await adminAPI.deleteRide(rideId);
      Modal.success({
        title: "Ride deleted",
        content: "The ride has been removed.",
      });
    } catch (err) {
      Modal.error({
        title: "Delete failed",
        content: err.response?.data?.message || "Could not delete this ride.",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      Modal.success({
        title: "User deleted",
        content: "The user has been removed.",
      });
    } catch (err) {
      Modal.error({
        title: "Delete failed",
        content: err.response?.data?.message || "Could not delete this user.",
      });
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const haystack =
        `${r.reporterName} ${r.reportedUserName} ${r.reason}`.toLowerCase();
      return !searchText || haystack.includes(searchText.toLowerCase());
    });
  }, [reports, searchText]);

  const columns = [
    { title: "Reported by", dataIndex: "reporterName" },
    { title: "Reported user", dataIndex: "reportedUserName" },
    {
      title: "Ride",
      dataIndex: "rideSummary",
      render: (summary, record) => (
        <Link to={`/rides/${record.rideId}`}>{summary || record.rideId}</Link>
      ),
    },
    { title: "Reason", dataIndex: "reason" },
    {
      title: "Status",
      dataIndex: "status",
      filters: [
        { text: "Pending", value: "PENDING" },
        { text: "Reviewed", value: "REVIEWED" },
        { text: "Dismissed", value: "DISMISSED" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => <Tag color={STATUS_COLORS[status]}>{status}</Tag>,
    },
    {
      title: "Submitted",
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
            onClick={() => setViewingReport(record)}
          />
          {record.status === "PENDING" && (
            <>
              <Popconfirm
                title="Mark this report as reviewed?"
                onConfirm={() => handleReview(record.id)}
              >
                <Button icon={<CheckOutlined />} size="small" />
              </Popconfirm>
              <Popconfirm
                title="Dismiss this report?"
                onConfirm={() => handleDismiss(record.id)}
              >
                <Button icon={<CloseOutlined />} size="small" danger />
              </Popconfirm>
            </>
          )}
          {record.rideId && (
            <Popconfirm
              title="Delete the reported ride?"
              description="This action cannot be undone."
              onConfirm={() => handleDeleteRide(record.rideId)}
            >
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          )}
          {record.reportedUserId && (
            <Popconfirm
              title="Delete the reported user?"
              description="This action cannot be undone."
              onConfirm={() => handleDeleteUser(record.reportedUserId)}
            >
              <Button icon={<UserDeleteOutlined />} size="small" danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ color: "#054752" }}>
        Reports
      </Title>

      <Space style={{ marginBottom: "16px" }} wrap>
        <Input.Search
          placeholder="Search by reporter, reported user, or reason"
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </Space>

      {error && <Text type="danger">{error}</Text>}

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filteredReports}
        scroll={{ x: "max-content" }}
      />

      <ReportDetailModal
        report={viewingReport}
        onClose={() => setViewingReport(null)}
      />
    </div>
  );
}
