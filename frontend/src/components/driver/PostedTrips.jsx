import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Space,
  Tag,
  Button,
  Empty,
  Select,
  Typography,
} from "antd";
import {
  RightOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import MapComponent from "../MapComponent";

const { Title, Text } = Typography;

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All rides" },
  { value: "ACTIVE", label: "ACTIVE rides" },
  { value: "ONGOING", label: "ONGOING rides" },
  { value: "COMPLETED", label: "COMPLETED rides" },
  { value: "CANCELLED", label: "CANCELLED rides" },
];

function PostedTripsList({
  postedRides,
  loadingRides,
  selectedRide,
  selectActiveRide,
}) {
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const filteredRides =
    statusFilter === "ALL"
      ? postedRides
      : postedRides.filter((ride) => ride.status === statusFilter);

  useEffect(() => {
    const stillVisible = filteredRides.some((r) => r.id === selectedRide?.id);
    if (!stillVisible) {
      selectActiveRide(filteredRides[0] || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  if (loadingRides) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Text type="secondary">Loading posted routes...</Text>
      </div>
    );
  }

  if (postedRides.length === 0) {
    return <Empty description="No posted trips yet." />;
  }

  return (
    <div>
      <Select
        value={statusFilter}
        onChange={setStatusFilter}
        options={STATUS_FILTER_OPTIONS}
        style={{ width: "100%", marginBottom: "12px" }}
      />
      {filteredRides.length === 0 ? (
        <Empty description="No posted trips match this filter." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredRides.map((ride) => (
            <div
              key={ride.id}
              onClick={() => selectActiveRide(ride)}
              style={{
                border:
                  selectedRide?.id === ride.id
                    ? "1px solid #00aff5"
                    : "1px solid #eef0f2",
                borderRadius: "12px",
                padding: "16px",
                cursor: "pointer",
                backgroundColor:
                  selectedRide?.id === ride.id
                    ? "rgba(0,175,245,0.02)"
                    : "transparent",
                transition: "all 0.2s",
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
                  {ride.source?.name.split(",")[0]} {" -> "}
                  {ride.destination?.name.split(",")[0]}
                </div>
                <Text type="secondary" style={{ fontSize: "0.85rem" }}>
                  {ride.availableSeats} seat(s) left | Status: {ride.status}
                </Text>
              </div>
              <RightOutlined
                style={{
                  color: selectedRide?.id === ride.id ? "#00aff5" : "#708c91",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectedRideCard({
  selectedRide,
  handleStartTrip,
  handleCompleteTrip,
  handleDeleteRide,
  onNavigateToRide,
}) {
  if (!selectedRide) return null;

  return (
    <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f6f7f9",
          paddingBottom: "16px",
          marginBottom: "16px",
        }}
      >
        <div>
          <Title
            level={4}
            style={{ margin: "0 0 4px", color: "#054752", fontWeight: 800 }}
          >
            {selectedRide.source?.name.split(",")[0]} {" -> "}
            {selectedRide.destination?.name.split(",")[0]}
          </Title>
          <Space size="middle">
            {selectedRide.departureTime && (
              <Text type="secondary">
                {dayjs(selectedRide.departureTime).format("DD MMM YYYY, HH:mm")}
              </Text>
            )}
            <Text type="secondary">
              Status:{" "}
              <Tag
                color={
                  selectedRide.status === "ACTIVE"
                    ? "processing"
                    : selectedRide.status === "CANCELLED"
                      ? "error"
                      : "default"
                }
              >
                {selectedRide.status}
              </Tag>
            </Text>
          </Space>
        </div>
        <Button
          type="default"
          shape="round"
          icon={<FileTextOutlined />}
          onClick={() => onNavigateToRide(selectedRide.id)}
        >
          View Ride Details
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          {selectedRide.status === "COMPLETED" && (
            <Text
              type="secondary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <SafetyCertificateOutlined style={{ color: "#52c41a" }} />
              Avoided:{" "}
              <strong>
                {selectedRide.executionDetails?.environmentalOffset?.netReducedCo2Kg?.toFixed(
                  2,
                ) || "0.00"}{" "}
                kg CO₂
              </strong>
            </Text>
          )}
        </div>

        <div>
          {selectedRide.status === "ACTIVE" && (
            <Space>
              <Button
                danger
                shape="round"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteRide(selectedRide.id)}
                style={{
                  height: "40px",
                  fontWeight: 600,
                }}
              >
                Delete Ride
              </Button>
              <Button
                type="primary"
                shape="round"
                icon={<PlayCircleOutlined />}
                onClick={handleStartTrip}
                style={{
                  backgroundColor: "#52c41a",
                  height: "40px",
                  fontWeight: 600,
                }}
              >
                Start Trip
              </Button>
            </Space>
          )}

          {selectedRide.status === "ONGOING" && (
            <Button
              danger
              type="primary"
              shape="round"
              onClick={handleCompleteTrip}
              style={{ height: "40px", fontWeight: 600 }}
            >
              Complete Trip
            </Button>
          )}

          {selectedRide.status === "COMPLETED" && (
            <span
              style={{ color: "#52c41a", fontWeight: 700, fontSize: "0.95rem" }}
            >
              ✓ Trip Completed Successfully
            </span>
          )}

          {selectedRide.status === "CANCELLED" && (
            <span
              style={{ color: "#ff4d4f", fontWeight: 700, fontSize: "0.95rem" }}
            >
              ✕ Ride Cancelled
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function PostedTrips({
  postedRides,
  loadingRides,
  selectedRide,
  selectActiveRide,
  mapProps,
  handleStartTrip,
  handleCompleteTrip,
  handleDeleteRide,
  onNavigateToRide,
}) {
  return (
    <Row gutter={[32, 32]}>
      <Col xs={24} md={9}>
        <Card
          title={
            <span style={{ color: "#054752", fontWeight: 800 }}>
              My Posted Trips
            </span>
          }
          style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
        >
          <PostedTripsList
            postedRides={postedRides}
            loadingRides={loadingRides}
            selectedRide={selectedRide}
            selectActiveRide={selectActiveRide}
          />
        </Card>
      </Col>

      <Col xs={24} md={15}>
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          <Card
            style={{
              borderRadius: "16px",
              border: "1px solid #eef0f2",
              overflow: "hidden",
            }}
            styles={{ body: { padding: 0 } }}
          >
            <div
              style={{ width: "100%", height: "400px", position: "relative" }}
            >
              <MapComponent
                source={mapProps.source}
                destination={mapProps.destination}
                routeCoords={mapProps.routeCoords}
              />
            </div>
          </Card>

          <SelectedRideCard
            selectedRide={selectedRide}
            handleStartTrip={handleStartTrip}
            handleCompleteTrip={handleCompleteTrip}
            handleDeleteRide={handleDeleteRide}
            onNavigateToRide={onNavigateToRide}
          />
        </Space>
      </Col>
    </Row>
  );
}
