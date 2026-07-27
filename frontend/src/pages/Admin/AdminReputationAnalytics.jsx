import { useEffect, useState } from "react";
import { Row, Col, Card, List, Progress, Typography, Empty, Tag } from "antd";
import { adminAPI } from "../../../api";

const { Title, Text } = Typography;

function ReputationList({ title, entries, color, emptyText }) {
  return (
    <Card
      title={title}
      style={{
        borderRadius: "16px",
        border: "1px solid #eef0f2",
        height: "100%",
      }}
    >
      {entries.length === 0 ? (
        <Empty description={emptyText} />
      ) : (
        <List
          dataSource={entries}
          renderItem={(entry) => (
            <List.Item>
              <div style={{ width: "100%" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <Text strong>{entry.name}</Text>
                    <div style={{ fontSize: "0.8rem", color: "#708c91" }}>
                      {entry.email}
                    </div>
                  </div>
                  <Tag>{entry.ratingCount} rating(s)</Tag>
                </div>
                <Progress
                  percent={Math.round(entry.overallScore)}
                  strokeColor={color}
                  style={{ marginTop: "8px" }}
                />
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

export default function AdminReputationAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await adminAPI.getReputationAnalytics();
        setAnalytics(res?.data || res);
      } catch {
        setError("Failed to load reputation analytics.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div>
      <Title level={3} style={{ color: "#054752" }}>
        Reputation Analytics
      </Title>

      {loading && <Text type="secondary">Loading reputation analytics...</Text>}
      {error && <Text type="danger">{error}</Text>}

      {!loading && !error && analytics && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <ReputationList
              title="Top Trusted Drivers"
              entries={analytics.topTrustedDrivers || []}
              color="#52c41a"
              emptyText="No rated drivers yet"
            />
          </Col>
          <Col xs={24} md={8}>
            <ReputationList
              title="Lowest Rated Users"
              entries={analytics.lowestRatedUsers || []}
              color="#faad14"
              emptyText="No rated users yet"
            />
          </Col>
          <Col xs={24} md={8}>
            <ReputationList
              title="Users Needing Review"
              entries={analytics.usersNeedingReview || []}
              color="#ff4d4f"
              emptyText="No users currently flagged"
            />
          </Col>
        </Row>
      )}
    </div>
  );
}
