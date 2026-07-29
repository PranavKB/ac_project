import { Card, Avatar, Space, Typography, Button } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

function BookingStatusBanner({ bookingStatus, rideStatus }) {
  const displayBookingStatus =
    bookingStatus === "APPROVED"
      ? rideStatus === "COMPLETED"
        ? "COMPLETED"
        : rideStatus === "ONGOING"
          ? "ONGOING"
          : "APPROVED"
      : bookingStatus;

  const statusStyles = {
    COMPLETED: { border: "1px solid #b7eb8f", bg: "#f6ffed", color: "#52c41a" },
    ONGOING: { border: "1px solid #91caff", bg: "#e6f7ff", color: "#00aff5" },
    APPROVED: { border: "1px solid #b7eb8f", bg: "#f6ffed", color: "#389e0d" },
    REJECTED: { border: "1px solid #ffccc7", bg: "#fff2f0", color: "#ff4d4f" },
    PENDING: { border: "1px solid #ffe58f", bg: "#fffbe6", color: "#d48806" },
  };
  const style = statusStyles[displayBookingStatus] || statusStyles.PENDING;

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
}

function DriverActions({ rideStatus, handleStartTrip, handleCompleteTrip }) {
  return (
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
  );
}

function PassengerActions({
  isBooked,
  bookingStatus,
  rideStatus,
  handleBookRide,
  bookingInProgress,
  availableSeats,
  requestedSeatCount,
}) {
  if (!isBooked) {
    const notEnoughSeats =
      availableSeats != null &&
      requestedSeatCount != null &&
      availableSeats < requestedSeatCount;

    return (
      <>
        <Button
          type="primary"
          block
          size="large"
          onClick={handleBookRide}
          loading={bookingInProgress}
          disabled={notEnoughSeats}
          style={{ height: "48px", fontWeight: 700, borderRadius: "12px" }}
        >
          Book Ride
        </Button>
        {notEnoughSeats && (
          <Text type="danger" style={{ fontSize: "0.85rem" }}>
            Only {availableSeats} seat{availableSeats !== 1 ? "s" : ""} left —
            you need {requestedSeatCount}.
          </Text>
        )}
      </>
    );
  }

  return (
    <BookingStatusBanner
      bookingStatus={bookingStatus}
      rideStatus={rideStatus}
    />
  );
}

export default function SidebarDetailCard({
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
  passengerCount,
  totalSeats,
  availableSeats,
  requestedSeatCount,
}) {
  const filledSeats =
    totalSeats != null && availableSeats != null
      ? totalSeats - availableSeats
      : passengerCount || 1;

  const displaySeatsLabel = isDriver
    ? `${filledSeats}/${totalSeats || 4} seats booked`
    : `${filledSeats > 0 ? filledSeats : passengerCount || 1} passenger${
        (filledSeats > 0 ? filledSeats : passengerCount || 1) !== 1 ? "s" : ""
      }`;

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
          {displaySeatsLabel}
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
          <DriverActions
            rideStatus={rideStatus}
            handleStartTrip={handleStartTrip}
            handleCompleteTrip={handleCompleteTrip}
          />
        ) : (
          <PassengerActions
            isBooked={isBooked}
            bookingStatus={bookingStatus}
            rideStatus={rideStatus}
            handleBookRide={handleBookRide}
            bookingInProgress={bookingInProgress}
            availableSeats={availableSeats}
            requestedSeatCount={requestedSeatCount}
          />
        )}
      </Space>
    </Card>
  );
}
