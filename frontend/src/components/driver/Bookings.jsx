import {
  Card,
  Space,
  Select,
  Avatar,
  Button,
  Tag,
  Empty,
  Typography,
} from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

function RequestRow({ req, showStatusTag, actions, showSuggestedTag }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid #f6f7f9",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Avatar icon={<UserOutlined />} />
        <div>
          <div
            style={{
              color: "#054752",
              fontWeight: 700,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {req.passengerName}
            {showSuggestedTag && (
              <Tag color="gold" style={{ borderRadius: "999px" }}>
                Suggested backup
              </Tag>
            )}
          </div>
          <div
            style={{ fontSize: "0.85rem", color: "#708c91", marginTop: "2px" }}
          >
            {req.source?.name.split(",")[0]} {" -> "}
            {req.destination?.name.split(",")[0]}
          </div>
        </div>
      </div>
      {showStatusTag ? (
        <Tag
          color="success"
          style={{ borderRadius: "999px", padding: "3px 10px" }}
        >
          {req.status}
        </Tag>
      ) : (
        actions
      )}
    </div>
  );
}

function ManagingRouteCard({ postedRides, selectedRide, selectActiveRide }) {
  if (postedRides.length === 0) return null;

  return (
    <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
      <Space size="middle">
        <Text strong style={{ color: "#054752" }}>
          Managing Route:
        </Text>
        <Select
          value={selectedRide?.id || ""}
          onChange={(val) => {
            const selected = postedRides.find((r) => r.id === val);
            if (selected) selectActiveRide(selected);
          }}
          style={{ width: "280px" }}
          options={postedRides.map((ride) => ({
            value: ride.id,
            label: `${ride.source?.name.split(",")[0]} -> ${ride.destination?.name.split(",")[0]} (${ride.status})`,
          }))}
        />
      </Space>
    </Card>
  );
}

export default function Bookings({
  postedRides,
  selectedRide,
  selectActiveRide,
  pendingRequests,
  acceptedPassengers,
  loadingRequests,
  handleAcceptRequest,
  handleRejectRequest,
}) {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        <ManagingRouteCard
          postedRides={postedRides}
          selectedRide={selectedRide}
          selectActiveRide={selectActiveRide}
        />

        <Card
          title={
            <span style={{ color: "#054752", fontWeight: 800 }}>
              Riders Request Queue ({pendingRequests.length})
            </span>
          }
          style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
        >
          {loadingRequests ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Text type="secondary">Loading requests...</Text>
            </div>
          ) : pendingRequests.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {pendingRequests.map((req, index) => (
                <RequestRow
                  key={req.id}
                  req={req}
                  showStatusTag={false}
                  showSuggestedTag={index === 0 && req.priorityScore > 0}
                  actions={
                    <Space>
                      <Button
                        type="primary"
                        size="small"
                        shape="round"
                        style={{ backgroundColor: "#52c41a" }}
                        onClick={() => handleAcceptRequest(req.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        type="primary"
                        danger
                        size="small"
                        shape="round"
                        onClick={() => handleRejectRequest(req.id)}
                      >
                        Reject
                      </Button>
                    </Space>
                  }
                />
              ))}
            </div>
          ) : (
            <Empty description="No pending riders in queue." />
          )}
        </Card>

        <Card
          title={
            <span style={{ color: "#054752", fontWeight: 800 }}>
              Already Accepted Passengers ({acceptedPassengers.length})
            </span>
          }
          style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
        >
          {loadingRequests ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Text type="secondary">Loading bookings...</Text>
            </div>
          ) : acceptedPassengers.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {acceptedPassengers.map((req) => (
                <RequestRow key={req.id} req={req} showStatusTag />
              ))}
            </div>
          ) : (
            <Empty description="No accepted passengers on this trip yet." />
          )}
        </Card>
      </Space>
    </div>
  );
}
