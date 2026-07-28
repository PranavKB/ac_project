import {
  Card,
  Row,
  Col,
  Progress,
  Avatar,
  Typography,
  Tag,
  Button,
  Space,
} from "antd";
import { LogoutOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

function ReputationCard({ reputation }) {
  return (
    <Card
      title={
        <span style={{ color: "#054752", fontWeight: 700 }}>
          Reputation Metrics
        </span>
      }
      style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
    >
      <Row
        gutter={[24, 24]}
        justify="center"
        style={{ textAlign: "center", marginBottom: "20px" }}
      >
        <Col span={8}>
          <Progress
            type="circle"
            percent={reputation?.trustScore || 80}
            size={70}
            strokeColor="#52c41a"
          />
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#708c91",
              marginTop: "8px",
              textTransform: "uppercase",
            }}
          >
            Trust
          </div>
        </Col>
        <Col span={8}>
          <Progress
            type="circle"
            percent={reputation?.reliabilityScore || 90}
            size={70}
            strokeColor="#00aff5"
          />
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#708c91",
              marginTop: "8px",
              textTransform: "uppercase",
            }}
          >
            Reliability
          </div>
        </Col>
        <Col span={8}>
          <Progress
            type="circle"
            percent={reputation?.comfortScore || 80}
            size={70}
            strokeColor="#faad14"
          />
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#708c91",
              marginTop: "8px",
              textTransform: "uppercase",
            }}
          >
            Comfort
          </div>
        </Col>
      </Row>
      <Card
        style={{
          background: "rgba(0,175,245,0.02)",
          border: "none",
          borderRadius: "12px",
        }}
      >
        <Text strong style={{ display: "block", marginBottom: "4px" }}>
          AI Member Summary:
        </Text>
        <Text type="secondary" style={{ fontSize: "0.9rem" }}>
          {reputation?.aiSummary ||
            "Member has verified contacts and completed onboarding."}
        </Text>
      </Card>
    </Card>
  );
}

function CarbonSavedCard({ carbonSaved }) {
  return (
    <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Avatar
          size={48}
          style={{
            backgroundColor: "#f6ffed",
            color: "#52c41a",
            fontSize: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🌱
        </Avatar>
        <div>
          <Title level={4} style={{ margin: 0, color: "#054752" }}>
            {carbonSaved ? carbonSaved.toFixed(1) : "0.0"} kg CO₂ saved
          </Title>
          <Text type="secondary" style={{ fontSize: "0.85rem" }}>
            Total environmental offset credited to your account.
          </Text>
        </div>
      </div>
    </Card>
  );
}

function TripsHistoryCard({ isDriverMode, userTrips, navigate }) {
  return (
    <Card
      title={
        <span style={{ color: "#054752", fontWeight: 700 }}>
          {isDriverMode ? "Posted Rides History" : "Booked Trips History"}
        </span>
      }
      style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
    >
      {userTrips.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {userTrips.map((trip) => {
            const displayStatus = isDriverMode
              ? trip.status
              : trip.status === "APPROVED" && trip.rideStatus === "ONGOING"
                ? "ONGOING"
                : trip.status === "APPROVED" && trip.rideStatus === "COMPLETED"
                  ? "COMPLETED"
                  : trip.status;

            const tagColors = {
              ONGOING: "processing",
              COMPLETED: "default",
              APPROVED: "success",
              PENDING: "warning",
            };
            const sourceLabel = trip.source?.name
              ? trip.source.name.split(",")[0]
              : "Origin";
            const destLabel = trip.destination?.name
              ? trip.destination.name.split(",")[0]
              : "Destination";
            const targetId = isDriverMode ? trip.id : trip.rideId;

            return (
              <div
                key={trip.id || targetId}
                onClick={() => targetId && navigate(`/rides/${targetId}`)}
                style={{
                  cursor: "pointer",
                  padding: "16px 0",
                  borderBottom: "1px solid #f6f7f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#054752",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      marginBottom: "4px",
                    }}
                  >
                    {sourceLabel} {" -> "} {destLabel}
                  </div>
                  <Text type="secondary" style={{ fontSize: "0.85rem" }}>
                    Price per seat:{" "}
                    {trip.pricePerSeat
                      ? `₹${trip.pricePerSeat}`
                      : "Not specified"}
                  </Text>
                </div>
                <Tag color={tagColors[displayStatus] || "blue"}>
                  {displayStatus}
                </Tag>
              </div>
            );
          })}
        </div>
      ) : (
        <Text type="secondary">
          {isDriverMode
            ? "You haven't posted any rides yet."
            : "You haven't requested any rides yet."}
        </Text>
      )}
    </Card>
  );
}

function AccountInfoCard({ user, memberSince, logout }) {
  return (
    <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <Text type="secondary">Registered Roles</Text>
        <Text strong style={{ color: "#054752", textTransform: "capitalize" }}>
          {user?.data?.roles ? user.data.roles.join(", ") : "User"}
        </Text>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <Text type="secondary">Member Since</Text>
        <Text strong style={{ color: "#054752" }}>
          {memberSince || "July 2026"}
        </Text>
      </div>
      <Button
        danger
        block
        size="large"
        icon={<LogoutOutlined />}
        onClick={logout}
        style={{ borderRadius: "12px", fontWeight: 600 }}
      >
        Log Out
      </Button>
    </Card>
  );
}

export default function AccountTabContent({
  reputation,
  carbonSaved,
  isDriverMode,
  userTrips,
  user,
  memberSince,
  logout,
  navigate,
}) {
  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <ReputationCard reputation={reputation} />
      <CarbonSavedCard carbonSaved={carbonSaved} />
      <TripsHistoryCard
        isDriverMode={isDriverMode}
        userTrips={userTrips}
        navigate={navigate}
      />
      <AccountInfoCard user={user} memberSince={memberSince} logout={logout} />
    </Space>
  );
}
