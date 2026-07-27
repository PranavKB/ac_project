import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../context/AuthContext/useAuth";
import MapComponent from "./MapComponent";
import PublishRide from "./PublishRide";
import { rideAPI, requestAPI, routeAPI } from "../../api";
import { calculateRouteDistance } from "../utils/helpers";
import {
  Card,
  Tabs,
  Button,
  Tag,
  Select,
  Row,
  Col,
  Space,
  Badge,
  Modal,
  Empty,
  Typography,
  Avatar,
} from "antd";
import {
  PlayCircleOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  RightOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// --- Helper sub-components to keep functions under 250 lines ---

function PublishTabContent({ onPublishSuccess, onMapUpdate, mapProps }) {
  return (
    <Row gutter={[32, 32]}>
      <Col xs={24} md={11}>
        <Card
          title={
            <Title
              level={3}
              style={{ margin: 0, color: "#054752", fontWeight: 800 }}
            >
              Offer a Ride
            </Title>
          }
          style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
        >
          <PublishRide
            isEmbed={true}
            onPublishSuccess={onPublishSuccess}
            onMapUpdate={onMapUpdate}
          />
        </Card>
      </Col>
      <Col xs={24} md={13}>
        <Card
          style={{
            borderRadius: "16px",
            border: "1px solid #eef0f2",
            overflow: "hidden",
            height: "100%",
            minHeight: "500px",
          }}
          styles={{ body: { padding: 0, height: "100%" } }}
        >
          <div style={{ width: "100%", height: "550px", position: "relative" }}>
            <MapComponent
              source={mapProps.source}
              destination={mapProps.destination}
              routeCoords={mapProps.routeCoords}
            />
          </div>
        </Card>
      </Col>
    </Row>
  );
}

function PostedTripsTabContent({
  postedRides,
  loadingRides,
  selectedRide,
  selectActiveRide,
  mapProps,
  handleStartTrip,
  handleCompleteTrip,
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
          {loadingRides ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Text type="secondary">Loading posted routes...</Text>
            </div>
          ) : postedRides.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {postedRides.map((ride) => (
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
                      color:
                        selectedRide?.id === ride.id ? "#00aff5" : "#708c91",
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No posted trips yet." />
          )}
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

          {selectedRide && (
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
                    style={{
                      margin: "0 0 4px",
                      color: "#054752",
                      fontWeight: 800,
                    }}
                  >
                    {selectedRide.source?.name.split(",")[0]} {" -> "}
                    {selectedRide.destination?.name.split(",")[0]}
                  </Title>
                  <Text type="secondary">
                    Status: <Tag color="processing">{selectedRide.status}</Tag>
                  </Text>
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
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
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
                      style={{
                        color: "#52c41a",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                      }}
                    >
                      ✓ Trip Completed Successfully
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )}
        </Space>
      </Col>
    </Row>
  );
}

function RequestQueueTabContent({
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
        {postedRides.length > 0 && (
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
        )}

        {/* Pending Request list */}
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
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #f6f7f9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <Avatar icon={<UserOutlined />} />
                    <div>
                      <div
                        style={{
                          color: "#054752",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                        }}
                      >
                        {req.passengerName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#708c91",
                          marginTop: "2px",
                        }}
                      >
                        {req.source?.name.split(",")[0]} {" -> "}
                        {req.destination?.name.split(",")[0]}
                      </div>
                    </div>
                  </div>
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
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No pending riders in queue." />
          )}
        </Card>

        {/* Already Accepted Passengers list */}
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
                <div
                  key={req.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #f6f7f9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <Avatar icon={<UserOutlined />} />
                    <div>
                      <div
                        style={{
                          color: "#054752",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                        }}
                      >
                        {req.passengerName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#708c91",
                          marginTop: "2px",
                        }}
                      >
                        {req.source?.name.split(",")[0]} {" -> "}
                        {req.destination?.name.split(",")[0]}
                      </div>
                    </div>
                  </div>
                  <Tag
                    color="success"
                    style={{ borderRadius: "999px", padding: "3px 10px" }}
                  >
                    {req.status}
                  </Tag>
                </div>
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

const updateMapRoute = async (source, destination, setMapProps) => {
  if (source && destination) {
    const srcCoords = [
      source.location.coordinates[0],
      source.location.coordinates[1],
    ];
    const destCoords = [
      destination.location.coordinates[0],
      destination.location.coordinates[1],
    ];
    const routeCoords = await routeAPI.fetch(
      { lat: srcCoords[0], lng: srcCoords[1] },
      { lat: destCoords[0], lng: destCoords[1] },
    );
    setMapProps({ source: srcCoords, destination: destCoords, routeCoords });
  }
};

const executeDriverAction = async (actionFn, successMsg, callback) => {
  try {
    const result = await actionFn();
    if (result.success) {
      Modal.success({ title: "Success", content: successMsg });
      callback();
    } else {
      Modal.error({
        title: "Failed",
        content: result.message || "Operation failed.",
      });
    }
  } catch (err) {
    console.error(err);
    Modal.error({ title: "Error", content: "Failed to perform operation." });
  }
};

// --- Main component ---

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "publish";
  const setActiveTab = (tabName) => setSearchParams({ tab: tabName });

  const [postedRides, setPostedRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [mapProps, setMapProps] = useState({
    source: null,
    destination: null,
    routeCoords: null,
  });

  const fetchDriverRides = async () => {
    if (!user?.data?.id) return;
    setLoadingRides(true);
    try {
      const response = await rideAPI.getByDriver(user.data.id);
      const rides = response?.data || response || [];
      setPostedRides(rides);

      if (rides.length > 0) {
        const activeRide =
          rides.find((r) => r.status === "ACTIVE" || r.status === "ONGOING") ||
          rides[0];
        setSelectedRide(activeRide);
        await updateMapRoute(
          activeRide.source,
          activeRide.destination,
          setMapProps,
        );
      }
    } catch (err) {
      console.error("Failed to fetch driver rides:", err);
    } finally {
      setLoadingRides(false);
    }
  };

  const fetchRideRequests = async (rideId) => {
    setLoadingRequests(true);
    try {
      const response = await requestAPI.getByRide(rideId);
      setRideRequests(response?.data || response || []);
    } catch (err) {
      console.error("Failed to fetch ride requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDriverRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (selectedRide?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRideRequests(selectedRide.id);
    } else {
      setRideRequests([]);
    }
  }, [selectedRide]);

  const handleStartTrip = () =>
    executeDriverAction(
      () => rideAPI.start(selectedRide.id),
      "Trip status is now ONGOING. Passengers have been notified.",
      fetchDriverRides,
    );

  const handleCompleteTrip = () => {
    const totalDist =
      selectedRide.routeCoords && selectedRide.routeCoords.length > 1
        ? calculateRouteDistance(selectedRide.routeCoords)
        : 12.5;
    return executeDriverAction(
      () => rideAPI.complete(selectedRide.id, totalDist),
      "Trip completed successfully. Carbon savings calculated.",
      fetchDriverRides,
    );
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await requestAPI.approve(requestId);
      Modal.success({
        title: "Accepted",
        content: "Passenger request accepted successfully!",
      });
      if (selectedRide?.id) {
        fetchRideRequests(selectedRide.id);
        fetchDriverRides();
      }
    } catch (err) {
      console.error("Failed to accept request:", err);
      Modal.error({
        title: "Error",
        content: "Failed to accept passenger request.",
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await requestAPI.reject(requestId);
      Modal.info({ title: "Rejected", content: "Passenger request rejected." });
      if (selectedRide?.id) fetchRideRequests(selectedRide.id);
    } catch (err) {
      console.error("Failed to reject request:", err);
      Modal.error({
        title: "Error",
        content: "Failed to reject passenger request.",
      });
    }
  };

  const selectActiveRide = async (ride) => {
    setSelectedRide(ride);
    await updateMapRoute(ride.source, ride.destination, setMapProps);
  };

  const pendingRequests = rideRequests.filter((r) => r.status === "PENDING");
  const acceptedPassengers = rideRequests.filter(
    (r) => r.status === "APPROVED",
  );
  const totalPendingCount = pendingRequests.length;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "30px 24px" }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
        items={[
          {
            key: "publish",
            label: (
              <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                Offer a Ride
              </span>
            ),
            children: (
              <PublishTabContent
                onPublishSuccess={async (newRide) => {
                  await fetchDriverRides();
                  if (newRide?.id) setSelectedRide(newRide);
                  setActiveTab("posted");
                }}
                onMapUpdate={setMapProps}
                mapProps={mapProps}
              />
            ),
          },
          {
            key: "posted",
            label: (
              <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                My Posted Trips ({postedRides.length})
              </span>
            ),
            children: (
              <PostedTripsTabContent
                postedRides={postedRides}
                loadingRides={loadingRides}
                selectedRide={selectedRide}
                selectActiveRide={selectActiveRide}
                mapProps={mapProps}
                handleStartTrip={handleStartTrip}
                handleCompleteTrip={handleCompleteTrip}
                onNavigateToRide={(rideId) => navigate(`/rides/${rideId}`)}
              />
            ),
          },
          {
            key: "requests",
            label: (
              <Badge count={totalPendingCount} offset={[10, -5]}>
                <span
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    paddingRight: totalPendingCount > 0 ? "8px" : 0,
                  }}
                >
                  Request Queue & Bookings
                </span>
              </Badge>
            ),
            children: (
              <RequestQueueTabContent
                postedRides={postedRides}
                selectedRide={selectedRide}
                selectActiveRide={selectActiveRide}
                pendingRequests={pendingRequests}
                acceptedPassengers={acceptedPassengers}
                loadingRequests={loadingRequests}
                handleAcceptRequest={handleAcceptRequest}
                handleRejectRequest={handleRejectRequest}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
