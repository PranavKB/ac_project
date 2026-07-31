import { Card, Avatar, Space, Typography, Tag, Button } from "antd";
import { StarFilled } from "@ant-design/icons";

const { Text } = Typography;

export default function PassengersCard({
  passengers,
  totalSeats,
  filledSeats,
  showRatingActions,
  hasRated,
  onRatePassenger,
}) {
  const activePassengersMap = new Map();
  passengers.forEach((p) => {
    const existing = activePassengersMap.get(p.passengerId);
    if (
      !existing ||
      p.status === "APPROVED" ||
      (p.status === "PENDING" && existing.status !== "APPROVED")
    ) {
      activePassengersMap.set(p.passengerId, p);
    }
  });
  const displayPassengers = Array.from(activePassengersMap.values());

  return (
    <Card
      title={
        <span style={{ color: "#054752", fontWeight: 700 }}>
          Passengers
          {totalSeats != null && filledSeats != null && (
            <span
              style={{ color: "#708c91", fontWeight: 500, marginLeft: "8px" }}
            >
              ({filledSeats}/{totalSeats} seats filled)
            </span>
          )}
        </span>
      }
      style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
    >
      {displayPassengers.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {displayPassengers.map((p, idx) => (
            <div
              key={p.id || idx}
              style={{
                padding: "12px 0",
                display: "flex",
                gap: "12px",
                alignItems: "center",
                borderBottom:
                  idx < passengers.length - 1 ? "1px solid #f6f7f9" : "none",
              }}
            >
              <Avatar
                style={{
                  backgroundColor: "rgba(0,132,255,0.1)",
                  color: "#0084ff",
                  fontWeight: 600,
                }}
              >
                {(p.passengerName || "P").charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#054752",
                    fontSize: "0.95rem",
                  }}
                >
                  {p.passengerName || "Passenger"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#708c91" }}>
                  {p.source?.name || "Unknown Source"} {" -> "}{" "}
                  {p.destination?.name || "Unknown Destination"}
                </div>
              </div>
              <Space style={{ marginLeft: "auto" }}>
                <Tag
                  color={p.status === "APPROVED" ? "success" : "warning"}
                  style={{ borderRadius: "999px", padding: "3px 10px" }}
                >
                  {p.status}
                </Tag>
                {showRatingActions &&
                  p.status === "APPROVED" &&
                  (hasRated(p.passengerId) ? (
                    <Tag color="blue" style={{ borderRadius: "999px" }}>
                      ✓ Rated
                    </Tag>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      icon={<StarFilled />}
                      onClick={() => onRatePassenger(p)}
                    >
                      Rate
                    </Button>
                  ))}
              </Space>
            </div>
          ))}
        </div>
      ) : (
        <Text type="secondary">No passengers booked yet.</Text>
      )}
    </Card>
  );
}
