import { useState, useEffect } from "react";
import {
  Modal,
  Typography,
  Space,
  Progress,
  Rate,
  Tag,
  Card,
  Divider,
  Avatar,
  List,
  Empty,
  Spin,
} from "antd";
import {
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ratingAPI } from "../../../api";

const { Title, Text, Paragraph } = Typography;

function OverallReputationHeader({
  overallStar,
  overall100,
  ratingsCount,
  aiSummary,
}) {
  return (
    <Card
      style={{
        borderRadius: "12px",
        background: "linear-gradient(135deg, #05d5f9 0%, #04c0ea 100%)",
        color: "#fff",
        marginBottom: "20px",
      }}
      styles={{ body: { padding: "20px" } }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Text style={{ color: "rgba(14, 14, 14, 0.85)", fontSize: "0.9rem" }}>
            Overall Driver Reputation
          </Text>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "4px",
            }}
          >
            <Title level={2} style={{ margin: 0 }}>
              {overallStar}
            </Title>
            <Rate
              disabled
              allowHalf
              value={parseFloat(overallStar)}
              style={{ color: "#faad14", fontSize: "1.2rem" }}
            />
          </div>
          <Text style={{ fontSize: "0.85rem" }}>
            {overall100} / 100 Overall Score • {ratingsCount} Review
            {ratingsCount !== 1 ? "s" : ""}
          </Text>
        </div>
        <Tag
          color="cyan"
          style={{
            fontSize: "0.9rem",
            padding: "6px 14px",
            borderRadius: "20px",
          }}
        >
          Verified Driver
        </Tag>
      </div>
      <Divider
        style={{
          borderColor: "rgba(255,255,255,0.2)",
          margin: "14px 0 10px",
        }}
      />
      <Text
        style={{
          fontSize: "0.88rem",
          fontStyle: "italic",
        }}
      >
        "{aiSummary || "Good standing in community."}"
      </Text>
    </Card>
  );
}

function CoreDimensionsGrid({ trustScore, reliabilityScore, comfortScore }) {
  return (
    <>
      <Title level={5} style={{ color: "#054752", marginBottom: "12px" }}>
        Core Reputation Dimensions
      </Title>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <Card
          style={{
            borderRadius: "12px",
            border: "1px solid #eef0f2",
            backgroundColor: "#f6ffed",
          }}
          styles={{ body: { padding: "14px" } }}
        >
          <Space style={{ fontWeight: 700, marginBottom: "6px" }}>
            <SafetyCertificateOutlined /> Trust ({Math.round(trustScore)}/100)
          </Space>
          <Progress
            percent={Math.round(trustScore)}
            status="active"
            strokeColor="#52c41a"
          />
          <Text type="secondary" style={{ fontSize: "0.8rem" }}>
            Punctuality, Safety & Low Cancellations
          </Text>
        </Card>

        <Card
          style={{
            borderRadius: "12px",
            border: "1px solid #eef0f2",
            backgroundColor: "#e6f7ff",
          }}
          styles={{ body: { padding: "14px" } }}
        >
          <Space style={{ fontWeight: 700, marginBottom: "6px" }}>
            <ThunderboltOutlined /> Reliability ({Math.round(reliabilityScore)}
            /100)
          </Space>
          <Progress
            percent={Math.round(reliabilityScore)}
            status="active"
            strokeColor="#00aff5"
          />
          <Text type="secondary" style={{ fontSize: "0.8rem" }}>
            Completion & Routine Consistency
          </Text>
        </Card>

        <Card
          style={{
            borderRadius: "12px",
            border: "1px solid #eef0f2",
            backgroundColor: "#fffbe6",
          }}
          styles={{ body: { padding: "14px" } }}
        >
          <Space style={{ fontWeight: 700, marginBottom: "6px" }}>
            <SmileOutlined /> Comfort ({Math.round(comfortScore)}/100)
          </Space>
          <Progress
            percent={Math.round(comfortScore)}
            status="active"
            strokeColor="#faad14"
          />
          <Text type="secondary" style={{ fontSize: "0.8rem" }}>
            Cleanliness & Communication
          </Text>
        </Card>
      </div>
    </>
  );
}

function DetailedMetricsGrid({ detailedMetrics }) {
  return (
    <>
      <Title level={5} style={{ color: "#054752", marginBottom: "12px" }}>
        Multi-Dimensional Metric Breakdown
      </Title>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px 20px",
          marginBottom: "24px",
        }}
      >
        {detailedMetrics.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #f6f7f9",
              paddingBottom: "6px",
            }}
          >
            <Text style={{ fontSize: "0.88rem" }}>
              <span style={{ marginRight: "6px" }}></span>
              {item.label}
            </Text>
            <Space size={4}>
              <Rate
                disabled
                allowHalf
                defaultValue={item.score}
                style={{ fontSize: "0.8rem", color: "#faad14" }}
              />
              <Text strong style={{ fontSize: "0.85rem", color: "#054752" }}>
                {item.score}
              </Text>
            </Space>
          </div>
        ))}
      </div>
    </>
  );
}

function PassengerReviewsList({ ratings, loading }) {
  const textReviews = ratings.filter((r) => r.textReview);

  return (
    <>
      <Title level={5} style={{ color: "#054752", marginBottom: "12px" }}>
        Passenger Reviews ({textReviews.length})
      </Title>
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin />
        </div>
      ) : textReviews.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No detailed text reviews written yet."
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={textReviews}
          style={{ maxHeight: "220px", overflowY: "auto" }}
          renderItem={(item) => (
            <List.Item style={{ padding: "10px 0" }}>
              <List.Item.Meta
                avatar={
                  <Avatar style={{ backgroundColor: "#708c91" }}>P</Avatar>
                }
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text strong style={{ fontSize: "0.85rem" }}>
                      Passenger Review
                    </Text>
                    <Text type="secondary" style={{ fontSize: "0.78rem" }}>
                      {item.createdAt
                        ? dayjs(item.createdAt).format("DD MMM YYYY")
                        : "Recent"}
                    </Text>
                  </div>
                }
                description={
                  <Paragraph
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      color: "#054752",
                    }}
                  >
                    "{item.textReview}"
                  </Paragraph>
                }
              />
            </List.Item>
          )}
        />
      )}
    </>
  );
}

export default function DriverReputationModal({
  visible,
  onClose,
  driverName,
  driverInitial,
  driverProfile,
  driverId,
}) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && driverId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      ratingAPI
        .getByUser(driverId)
        .then((res) => {
          setRatings(res?.data || res || []);
        })
        .catch((err) => console.error("Failed to load driver ratings:", err))
        .finally(() => setLoading(false));
    }
  }, [visible, driverId]);

  const rep = driverProfile?.reputationProfile || {
    trustScore: 80,
    reliabilityScore: 80,
    comfortScore: 80,
    aiSummary: "New driver.",
  };

  const trustScore = rep.trustScore || 80;
  const reliabilityScore = rep.reliabilityScore || 80;
  const comfortScore = rep.comfortScore || 80;
  const overall100 = Math.round(
    (trustScore + reliabilityScore + comfortScore) / 3,
  );
  const overallStar = (overall100 / 20).toFixed(1);

  const avg = (fn) => {
    if (!ratings || ratings.length === 0) return 4.0;
    const sum = ratings.reduce(
      (acc, r) => acc + (r.metrics ? fn(r.metrics) || 4 : 4),
      0,
    );
    return Math.round((sum / ratings.length) * 10) / 10;
  };

  const detailedMetrics = [
    {
      label: "Punctuality",
      score: avg((m) => m.punctualityFactor),
    },
    {
      label: "Cancellation Record",
      score: avg((m) => m.cancellationConsistency),
    },
    {
      label: "Safe Driving",
      score: avg((m) => m.safeDrivingAssessment),
    },
    {
      label: "Ride Completion Rate",
      score: avg((m) => m.rideCompletionSuccess),
    },
    {
      label: "Routine Consistency",
      score: avg((m) => m.uniformRoutineConsistency),
    },
    {
      label: "Vehicle Cleanliness",
      score: avg((m) => m.vehicleCleanlinessMetric),
    },
    {
      label: "Communication Quality",
      score: avg((m) => m.communicationQualityFeedback),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={680}
      title={
        <Space size="middle">
          <Avatar style={{ backgroundColor: "#00aff5", fontWeight: 700 }}>
            {driverInitial || driverName?.charAt(0)}
          </Avatar>
          <div>
            <Title level={4} style={{ margin: 0, color: "#054752" }}>
              {driverName}'s Rating
            </Title>
          </div>
        </Space>
      }
      style={{ top: 20 }}
    >
      <div style={{ marginTop: "16px" }}>
        <OverallReputationHeader
          overallStar={overallStar}
          overall100={overall100}
          ratingsCount={ratings.length}
          aiSummary={rep.aiSummary}
        />
        <CoreDimensionsGrid
          trustScore={trustScore}
          reliabilityScore={reliabilityScore}
          comfortScore={comfortScore}
        />
        <DetailedMetricsGrid detailedMetrics={detailedMetrics} />
        <PassengerReviewsList ratings={ratings} loading={loading} />
      </div>
    </Modal>
  );
}
