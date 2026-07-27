import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Typography } from "antd";
import {
  TeamOutlined,
  CarOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  CloudOutlined,
} from "@ant-design/icons";
import { adminAPI } from "../../../api";

const { Title, Text } = Typography;

const KPI_CARDS = [
  {
    key: "totalUsers",
    title: "Total Users",
    icon: <TeamOutlined />,
    color: "#00aff5",
  },
  {
    key: "totalRides",
    title: "Total Rides",
    icon: <CarOutlined />,
    color: "#054752",
  },
  {
    key: "activeRides",
    title: "Active Rides",
    icon: <ThunderboltOutlined />,
    color: "#faad14",
  },
  {
    key: "completedRides",
    title: "Completed Rides",
    icon: <CheckCircleOutlined />,
    color: "#52c41a",
  },
  {
    key: "pendingRideRequests",
    title: "Pending Ride Requests",
    icon: <ClockCircleOutlined />,
    color: "#ff4d4f",
  },
  {
    key: "averageUserRating",
    title: "Average User Rating",
    icon: <StarOutlined />,
    color: "#faad14",
    suffix: "/ 100",
  },
  {
    key: "totalCo2SavedKg",
    title: "Total CO₂ Saved",
    icon: <CloudOutlined />,
    color: "#52c41a",
    suffix: "kg",
  },
];

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await adminAPI.getOverviewStats();
        setStats(res?.data || res);
      } catch {
        setError("Failed to load platform statistics.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      <Title level={3} style={{ color: "#054752", marginBottom: "20px" }}>
        Dashboard Overview
      </Title>

      {loading && <Text type="secondary">Loading platform statistics...</Text>}
      {error && <Text type="danger">{error}</Text>}

      {!loading && !error && stats && (
        <Row gutter={[16, 16]}>
          {KPI_CARDS.map((card) => (
            <Col xs={24} sm={12} md={8} lg={6} key={card.key}>
              <Card
                style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
              >
                <Statistic
                  title={card.title}
                  value={stats[card.key] ?? 0}
                  precision={
                    card.key === "averageUserRating" ||
                    card.key === "totalCo2SavedKg"
                      ? 2
                      : 0
                  }
                  prefix={
                    <span style={{ color: card.color }}>{card.icon}</span>
                  }
                  suffix={card.suffix}
                  valueStyle={{ color: "#054752", fontWeight: 700 }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
