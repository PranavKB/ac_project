import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { rideAPI, requestAPI, messageAPI } from "../../api";
import { calculateRouteDistance } from "../utils/helpers";
import useAuth from "../context/AuthContext/useAuth";
import {
  Card,
  Button,
  Avatar,
  Space,
  Input,
  Typography,
  Row,
  Col,
  Alert,
  Modal,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  StarFilled,
  MessageOutlined,
  ThunderboltFilled,
  SafetyCertificateOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  RightOutlined,
  SendOutlined,
  CarOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

// --- Helper Sub-components to satisfy max-lines-per-function rule ---

function RouteTimelineCard({
  depTime,
  arrTime,
  durationText,
  srcName,
  srcFull,
  destName,
  destFull,
}) {
  return (
    <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
      <div style={{ display: "flex", gap: "24px", padding: "10px 0" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "50px",
            alignItems: "flex-end",
            minWidth: "50px",
          }}
        >
          <span
            style={{ fontSize: "1.1rem", fontWeight: 800, color: "#054752" }}
          >
            {depTime}
          </span>
          <span
            style={{ fontSize: "0.85rem", color: "#708c91", fontWeight: 500 }}
          >
            {durationText}
          </span>
          <span
            style={{ fontSize: "1.1rem", fontWeight: 800, color: "#054752" }}
          >
            {arrTime}
          </span>
        </div>

        <div
          style={{
            position: "relative",
            width: "2px",
            backgroundColor: "#00aff5",
            margin: "8px 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-4px",
              left: "-4px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#fff",
              border: "2px solid #00aff5",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-4px",
              left: "-4px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#fff",
              border: "2px solid #00aff5",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "50px",
            flex: 1,
          }}
        >
          <div>
            <span
              style={{ fontSize: "1.1rem", fontWeight: 700, color: "#054752" }}
            >
              {srcName}
            </span>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#708c91",
                marginTop: "2px",
              }}
            >
              {srcFull}
            </div>
          </div>
          <div>
            <span
              style={{ fontSize: "1.1rem", fontWeight: 700, color: "#054752" }}
            >
              {destName}
            </span>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#708c91",
                marginTop: "2px",
              }}
            >
              {destFull}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DriverDetailsCard({ driverInitial, driverName }) {
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
        <Space size="middle">
          <Avatar
            size={48}
            style={{
              backgroundColor: "#e6f7ff",
              color: "#00aff5",
              fontWeight: 600,
            }}
          >
            {driverInitial}
          </Avatar>
          <div>
            <Title
              level={4}
              style={{ margin: 0, fontSize: "1.1rem", color: "#054752" }}
            >
              {driverName}
            </Title>
            <Space size={4} style={{ color: "#faad14", fontSize: "0.85rem" }}>
              <StarFilled />
              <span style={{ fontWeight: 600 }}>4.8 / 5</span>
            </Space>
          </div>
        </Space>
        <RightOutlined style={{ color: "#708c91" }} />
      </div>
      <Space
        orientation="vertical"
        size="middle"
        style={{
          width: "100%",
          fontSize: "0.95rem",
          color: "#054752",
          marginBottom: "20px",
        }}
      >
        <div>
          <ThunderboltFilled style={{ color: "#00aff5", marginRight: "8px" }} />{" "}
          Your booking will be confirmed instantly
        </div>
        <div> No smoking, please</div>
        <div>
          <CarOutlined style={{ color: "#708c91", marginRight: "8px" }} /> Max.
          2 in the back
        </div>
        <div> TOYOTA Innova - Grey</div>
      </Space>
      <Button
        type="default"
        shape="round"
        icon={<MessageOutlined />}
        onClick={() =>
          Modal.info({
            title: "Contact",
            content: `Contacting ${driverName}...`,
          })
        }
        style={{ borderColor: "#00aff5", color: "#00aff5", fontWeight: 700 }}
      >
        Contact {driverName}
      </Button>
    </Card>
  );
}

function PassengersCard({ passengers }) {
  return (
    <Card
      title={
        <span style={{ color: "#054752", fontWeight: 700 }}>Passengers</span>
      }
      style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
    >
      {passengers.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {passengers.map((p, idx) => (
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
              <Tag
                color={p.status === "APPROVED" ? "success" : "warning"}
                style={{
                  borderRadius: "999px",
                  padding: "3px 10px",
                  float: "right",
                  marginLeft: "auto",
                }}
              >
                {p.status}
              </Tag>
            </div>
          ))}
        </div>
      ) : (
        <Text type="secondary">No passengers booked yet.</Text>
      )}
    </Card>
  );
}

function TripChatCard({
  messages,
  user,
  newMessageText,
  setNewMessageText,
  handleSendMessage,
  sendingMessage,
}) {
  return (
    <Card
      title={
        <span style={{ color: "#054752", fontWeight: 700 }}>💬 Trip Chat</span>
      }
      style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
    >
      <div
        style={{
          maxHeight: "250px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: "16px",
          padding: "12px",
          border: "1px solid #eef0f2",
          borderRadius: "12px",
          background: "#f9fafb",
        }}
      >
        {messages.length > 0 ? (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.data?.id;
            return (
              <div
                key={msg.id || idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  flexDirection: isMe ? "row-reverse" : "row",
                }}
              >
                <Avatar
                  size="small"
                  style={{ backgroundColor: isMe ? "#00aff5" : "#8c8c8c" }}
                >
                  {(msg.senderName || "?").charAt(0).toUpperCase()}
                </Avatar>
                <div
                  style={{
                    background: isMe ? "#00aff5" : "#ffffff",
                    color: isMe ? "#ffffff" : "#054752",
                    padding: "8px 14px",
                    borderRadius: "12px",
                    border: isMe ? "none" : "1px solid #eef0f2",
                    maxWidth: "70%",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      marginBottom: "2px",
                      opacity: 0.8,
                    }}
                  >
                    {msg.senderName || "Unknown"}
                  </div>
                  <div style={{ fontSize: "0.9rem" }}>{msg.messageText}</div>
                </div>
              </div>
            );
          })
        ) : (
          <Text
            type="secondary"
            style={{ textAlign: "center", display: "block", padding: "16px 0" }}
          >
            No messages in chat yet.
          </Text>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <Input
          value={newMessageText}
          onChange={(e) => setNewMessageText(e.target.value)}
          placeholder="Type a message..."
          onPressEnter={handleSendMessage}
          style={{ borderRadius: "20px" }}
        />
        <Button
          type="primary"
          shape="circle"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          disabled={sendingMessage || !newMessageText.trim()}
        />
      </div>
    </Card>
  );
}

function SidebarDetailCard({
  formattedDate,
  depTime,
  srcName,
  durationText,
  arrTime,
  destName,
  driverInitial,
  driverName,
  priceAmount,
  isDriver,
  rideStatus,
  handleStartTrip,
  handleCompleteTrip,
  isBooked,
  bookingStatus,
  handleBookRide,
  bookingInProgress,
}) {
  return (
    <Card
      title={
        <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#054752" }}>
          {formattedDate}
        </span>
      }
      style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          fontSize: "0.95rem",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "12px" }}>
          <Text strong style={{ minWidth: "45px" }}>
            {depTime}
          </Text>
          <Text strong>{srcName}</Text>
        </div>
        <div
          style={{
            paddingLeft: "12px",
            borderLeft: "2px solid #00aff5",
            marginLeft: "68px",
            fontSize: "0.85rem",
            color: "#708c91",
          }}
        >
          {durationText}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Text strong style={{ minWidth: "45px" }}>
            {arrTime}
          </Text>
          <Text strong>{destName}</Text>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #f6f7f9",
          borderBottom: "1px solid #f6f7f9",
          padding: "12px 0",
          marginBottom: "20px",
        }}
      >
        <Space>
          <Avatar size="small" style={{ backgroundColor: "#00aff5" }}>
            {driverInitial}
          </Avatar>
          <Text strong>{driverName}</Text>
        </Space>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <Text style={{ fontSize: "0.95rem", fontWeight: 600 }}>
          1 passenger
        </Text>
        <Title
          level={3}
          style={{ margin: 0, color: "#054752", fontWeight: 800 }}
        >
          {priceAmount}
        </Title>
      </div>

      <Space orientation="vertical" style={{ width: "100%" }} size="middle">
        {isDriver ? (
          <>
            {rideStatus === "ACTIVE" && (
              <Button
                type="primary"
                block
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStartTrip}
                style={{
                  height: "48px",
                  fontWeight: 700,
                  backgroundColor: "#52c41a",
                }}
              >
                Start Trip
              </Button>
            )}
            {rideStatus === "ONGOING" && (
              <Button
                danger
                type="primary"
                block
                size="large"
                onClick={handleCompleteTrip}
                style={{ height: "48px", fontWeight: 700 }}
              >
                Complete Trip
              </Button>
            )}
            {rideStatus === "COMPLETED" && (
              <span
                style={{
                  color: "#52c41a",
                  fontWeight: 700,
                  fontSize: "1rem",
                  textAlign: "center",
                  display: "block",
                }}
              >
                ✓ Trip Completed Successfully
              </span>
            )}
          </>
        ) : (
          <>
            {!isBooked && (
              <Button
                type="primary"
                block
                size="large"
                onClick={handleBookRide}
                loading={bookingInProgress}
                style={{
                  height: "48px",
                  fontWeight: 700,
                  borderRadius: "12px",
                }}
              >
                Book Ride
              </Button>
            )}
            {isBooked &&
              (() => {
                const displayBookingStatus =
                  bookingStatus === "APPROVED"
                    ? rideStatus === "COMPLETED"
                      ? "COMPLETED"
                      : rideStatus === "ONGOING"
                        ? "ONGOING"
                        : "APPROVED"
                    : bookingStatus;

                const statusStyles = {
                  COMPLETED: {
                    border: "1px solid #b7eb8f",
                    bg: "#f6ffed",
                    color: "#52c41a",
                  },
                  ONGOING: {
                    border: "1px solid #91caff",
                    bg: "#e6f7ff",
                    color: "#00aff5",
                  },
                  APPROVED: {
                    border: "1px solid #b7eb8f",
                    bg: "#f6ffed",
                    color: "#389e0d",
                  },
                  REJECTED: {
                    border: "1px solid #ffccc7",
                    bg: "#fff2f0",
                    color: "#ff4d4f",
                  },
                  PENDING: {
                    border: "1px solid #ffe58f",
                    bg: "#fffbe6",
                    color: "#d48806",
                  },
                };
                const style =
                  statusStyles[displayBookingStatus] || statusStyles.PENDING;

                return (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      borderRadius: "12px",
                      border: style.border,
                      backgroundColor: style.bg,
                    }}
                  >
                    <Text strong style={{ color: style.color }}>
                      Booking Status: {displayBookingStatus}
                    </Text>
                  </div>
                );
              })()}
          </>
        )}
      </Space>
    </Card>
  );
}

function RideDetailsLoadingView() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <Text type="secondary" style={{ fontSize: "1.2rem" }}>
        Loading ride details...
      </Text>
    </div>
  );
}

function RideDetailsErrorView({ error, onGoBack }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        padding: "0 24px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "450px",
          borderRadius: "16px",
          textAlign: "center",
        }}
      >
        <Title level={3}>Ride Not Found</Title>
        <Paragraph type="secondary">
          {error || "The requested ride does not exist."}
        </Paragraph>
        <Button
          type="primary"
          size="large"
          block
          onClick={onGoBack}
          style={{ borderRadius: "12px", marginTop: "12px", fontWeight: 600 }}
        >
          Go Back
        </Button>
      </Card>
    </div>
  );
}

function GridDetailsLayout({
  depTime,
  arrTime,
  durationText,
  srcName,
  srcFull,
  destName,
  destFull,
  driverInitial,
  driverName,
  passengers,
  ride,
  messages,
  user,
  newMessageText,
  setNewMessageText,
  handleSendMessage,
  sendingMessage,
  formattedDate,
  priceAmount,
  isDriver,
  handleStartTrip,
  handleCompleteTrip,
  isBooked,
  bookingStatus,
  handleBookRide,
  bookingInProgress,
  distanceKm,
  co2Kg,
}) {
  return (
    <Row gutter={[32, 32]}>
      <Col xs={24} md={15}>
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          <RouteTimelineCard
            depTime={depTime}
            arrTime={arrTime}
            durationText={durationText}
            srcName={srcName}
            srcFull={srcFull}
            destName={destName}
            destFull={destFull}
          />
          <DriverDetailsCard
            driverInitial={driverInitial}
            driverName={driverName}
          />
          <PassengersCard passengers={passengers} />
          {ride.status === "ONGOING" && (
            <TripChatCard
              messages={messages}
              user={user}
              newMessageText={newMessageText}
              setNewMessageText={setNewMessageText}
              handleSendMessage={handleSendMessage}
              sendingMessage={sendingMessage}
            />
          )}
          <Alert
            message={
              <div style={{ color: "#054752" }}>
                By choosing this trip, you will help avoid{" "}
                <strong>≈{co2Kg > 0 ? co2Kg.toFixed(1) : "—"} kg of CO₂</strong>
                {distanceKm > 0 && (
                  <span
                    style={{
                      color: "#708c91",
                      fontSize: "0.82rem",
                      marginLeft: "6px",
                    }}
                  >
                    ({distanceKm} km route)
                  </span>
                )}
                .
              </div>
            }
            type="success"
            showIcon
            icon={<SafetyCertificateOutlined style={{ color: "#52c41a" }} />}
            style={{ borderRadius: "16px", padding: "14px 20px" }}
          />
          <Button
            type="text"
            danger
            icon={<WarningOutlined />}
            onClick={() =>
              Modal.info({ title: "Report", content: "Report ride submitted." })
            }
            style={{ padding: 0 }}
          >
            Report ride
          </Button>
        </Space>
      </Col>

      <Col xs={24} md={9}>
        <div style={{ position: "sticky", top: "90px" }}>
          <SidebarDetailCard
            formattedDate={formattedDate}
            depTime={depTime}
            srcName={srcName}
            durationText={durationText}
            arrTime={arrTime}
            destName={destName}
            driverInitial={driverInitial}
            driverName={driverName}
            priceAmount={priceAmount}
            isDriver={isDriver}
            rideStatus={ride.status}
            handleStartTrip={handleStartTrip}
            handleCompleteTrip={handleCompleteTrip}
            isBooked={isBooked}
            bookingStatus={bookingStatus}
            handleBookRide={handleBookRide}
            bookingInProgress={bookingInProgress}
          />
        </div>
      </Col>
    </Row>
  );
}

// Mirrors CarbonService.java: distKm × 0.08 L/km × 2.33 kg/L × passengerCount
const FUEL_PER_KM = 0.08;
const CO2_PER_LITER = 2.33;

function calculateCo2(distanceKm, passengerCount) {
  const avoided = distanceKm * FUEL_PER_KM * Math.max(1, passengerCount);
  return Math.round(avoided * CO2_PER_LITER * 100) / 100;
}

const parseRideTimesAndLocations = (ride, passengerCount = 1) => {
  if (!ride) return {};
  const srcName = ride.source?.name ? ride.source.name.split(",")[0] : "Origin";
  const srcFull = ride.source?.name || "Detailed address not specified";
  const destName = ride.destination?.name
    ? ride.destination.name.split(",")[0]
    : "Destination";
  const destFull = ride.destination?.name || "Detailed address not specified";

  const depTime = ride.departureTime
    ? new Date(ride.departureTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  // Derive arrival time from departureTime + estimatedDurationMinutes
  const arrTime = (() => {
    if (!ride.departureTime || !ride.estimatedDurationMinutes) return "N/A";
    const arrival = new Date(
      new Date(ride.departureTime).getTime() +
        ride.estimatedDurationMinutes * 60 * 1000,
    );
    return arrival.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  // Format estimatedDurationMinutes → "Xh Ym" / "Ym"
  const mins = ride.estimatedDurationMinutes;
  let durationText = "N/A";
  if (mins && mins > 0) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    durationText = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
  }

  const priceAmount = ride.pricePerSeat
    ? `₹${ride.pricePerSeat.toLocaleString("en-IN")}.00`
    : "N/A";

  const formattedDate = ride.departureTime
    ? new Date(ride.departureTime).toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "N/A";

  // Compute distance from stored route coordinates
  const distanceKm =
    ride.routeCoords?.length >= 2
      ? Math.round(calculateRouteDistance(ride.routeCoords) * 10) / 10
      : 0;

  // For COMPLETED rides use the authoritative backend-stored value;
  // for ACTIVE/ONGOING show a frontend estimate as a preview.
  const co2Kg =
    ride.status === "COMPLETED" &&
    ride.executionDetails?.environmentalOffset?.netReducedCo2Kg != null
      ? ride.executionDetails.environmentalOffset.netReducedCo2Kg
      : calculateCo2(distanceKm, passengerCount);

  return {
    srcName,
    srcFull,
    destName,
    destFull,
    depTime,
    arrTime,
    durationText,
    priceAmount,
    formattedDate,
    distanceKm,
    co2Kg,
  };
};

const executeRideAction = async (actionFn, successMsg, callback) => {
  try {
    const result = await actionFn();
    if (result.success) {
      Modal.success({ title: "Success", content: successMsg });
      callback();
    }
  } catch (err) {
    console.error(err);
    Modal.error({ title: "Error", content: "Failed to perform action." });
  }
};

const requestRideBooking = async (
  ride,
  user,
  navigate,
  setBookingInProgress,
  fetchRideData,
) => {
  if (!user?.data?.id) {
    Modal.info({
      title: "Login Required",
      content: "Please login to book a ride!",
      onOk: () => navigate("/login"),
    });
    return;
  }
  setBookingInProgress(true);
  try {
    const reqData = {
      rideId: ride.id,
      passengerId: user.data.id,
      passengerName: user.data.name,
      source: ride.source,
      destination: ride.destination,
      passengerH3Segments: [],
    };
    await requestAPI.create(reqData);
    Modal.success({
      title: "Booking Requested",
      content: "Booking request submitted successfully!",
    });
    fetchRideData();
  } catch (err) {
    Modal.error({
      title: "Booking Failed",
      content:
        err.response?.data?.message || "Failed to submit booking request.",
    });
  } finally {
    setBookingInProgress(false);
  }
};

// --- Main component ---

export default function RideDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, activeRole, refreshUser } = useAuth();

  const [ride, setRide] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Chat message states
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchRideData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await rideAPI.get(id);
      setRide(resp?.data || resp);
      const reqResp = await requestAPI.getByRide(id).catch(() => null);
      setPassengers(reqResp?.data || reqResp || []);
    } catch {
      setError("Failed to load ride details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;
    try {
      const resp = await messageAPI.getByRide(id);
      setMessages(resp?.data || resp || []);
    } catch {
      // Ignored
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !user?.data?.id) return;
    setSendingMessage(true);
    try {
      await messageAPI.send({
        rideId: ride.id,
        senderId: user.data.id,
        senderName: user.data.name,
        messageText: newMessageText.trim(),
      });
      setNewMessageText("");
      fetchMessages();
    } catch {
      Modal.error({ title: "Error", content: "Failed to send message." });
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRideData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (ride?.status === "ONGOING") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.status, id]);

  if (loading) return <RideDetailsLoadingView />;
  if (error || !ride)
    return <RideDetailsErrorView error={error} onGoBack={() => navigate(-1)} />;

  const isDriver = activeRole === "DRIVER" && user?.data?.id === ride.driverId;
  const myBooking = passengers.find((p) => p.passengerId === user?.data?.id);
  const isBooked = !!myBooking;
  const bookingStatus = myBooking?.status;
  const driverName = ride.driverName || "Driver";
  const driverInitial = driverName.charAt(0).toUpperCase();

  const {
    srcName,
    srcFull,
    destName,
    destFull,
    depTime,
    arrTime,
    durationText,
    priceAmount,
    formattedDate,
    distanceKm,
    co2Kg,
  } = parseRideTimesAndLocations(ride, passengers.length);

  const handleBookRide = () =>
    requestRideBooking(
      ride,
      user,
      navigate,
      setBookingInProgress,
      fetchRideData,
    );

  const handleStartTrip = () =>
    executeRideAction(
      () => rideAPI.start(ride.id),
      "Trip started! Status is now ONGOING.",
      fetchRideData,
    );
  const handleCompleteTrip = () =>
    executeRideAction(
      () => rideAPI.complete(ride.id, distanceKm || 0),
      "Trip completed successfully!",
      () => {
        fetchRideData();
        refreshUser();
      },
    );

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "30px 24px" }}>
      <Button
        onClick={() => navigate(-1)}
        icon={<ArrowLeftOutlined />}
        style={{
          borderRadius: "9999px",
          fontWeight: 700,
          marginBottom: "24px",
        }}
      >
        Back
      </Button>
      <Title
        level={2}
        style={{ color: "#054752", fontWeight: 800, marginBottom: "28px" }}
      >
        Ride details
      </Title>
      <GridDetailsLayout
        depTime={depTime}
        arrTime={arrTime}
        durationText={durationText}
        srcName={srcName}
        srcFull={srcFull}
        destName={destName}
        destFull={destFull}
        driverInitial={driverInitial}
        driverName={driverName}
        passengers={passengers}
        ride={ride}
        messages={messages}
        user={user}
        newMessageText={newMessageText}
        setNewMessageText={setNewMessageText}
        handleSendMessage={handleSendMessage}
        sendingMessage={sendingMessage}
        formattedDate={formattedDate}
        priceAmount={priceAmount}
        isDriver={isDriver}
        handleStartTrip={handleStartTrip}
        handleCompleteTrip={handleCompleteTrip}
        isBooked={isBooked}
        bookingStatus={bookingStatus}
        handleBookRide={handleBookRide}
        bookingInProgress={bookingInProgress}
        distanceKm={distanceKm}
        co2Kg={co2Kg}
      />
    </div>
  );
}
