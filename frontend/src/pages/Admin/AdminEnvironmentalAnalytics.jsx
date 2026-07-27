import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Typography } from "antd";
import {
  CloudOutlined,
  ThunderboltOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { adminAPI } from "../../../api";

const { Title, Text } = Typography;

export default function AdminEnvironmentalAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await adminAPI.getEnvironmentalAnalytics();
        setAnalytics(res?.data || res);
      } catch {
        setError("Failed to load environmental analytics.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div>
      <Title level={3} style={{ color: "#054752" }}>
        Environmental Analytics
      </Title>

      {loading && (
        <Text type="secondary">Loading environmental analytics...</Text>
      )}
      {error && <Text type="danger">{error}</Text>}

      {!loading && !error && analytics && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={8}>
              <Card
                style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
              >
                <Statistic
                  title="Total CO₂ Saved"
                  value={analytics.totalCo2SavedKg}
                  precision={1}
                  suffix="kg"
                  prefix={<CloudOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ color: "#054752", fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
              >
                <Statistic
                  title="Fuel Saved"
                  value={analytics.totalFuelSavedLiters}
                  precision={1}
                  suffix="Litres"
                  prefix={<ThunderboltOutlined style={{ color: "#faad14" }} />}
                  valueStyle={{ color: "#054752", fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
              >
                <Statistic
                  title="Shared Trips"
                  value={analytics.sharedTrips}
                  prefix={<TeamOutlined style={{ color: "#00aff5" }} />}
                  valueStyle={{ color: "#054752", fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title="Monthly Carbon Savings"
            style={{
              borderRadius: "16px",
              border: "1px solid #eef0f2",
              marginBottom: "24px",
            }}
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={analytics.monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="co2SavedKg"
                  name="CO₂ Saved (kg)"
                  fill="#52c41a"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card
            title="Trips Completed per Month"
            style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tripsCompleted"
                  name="Trips Completed"
                  stroke="#00aff5"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}
