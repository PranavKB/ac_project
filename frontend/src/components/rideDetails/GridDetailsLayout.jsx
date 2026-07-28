import { Row, Col, Space, Button, Alert } from "antd";
import { SafetyCertificateOutlined, WarningOutlined } from "@ant-design/icons";
import RouteTimelineCard from "./RouteTimelineCard";
import DriverDetailsCard from "./DriverDetailsCard";
import PassengersCard from "./PassengersCard";
import TripChatCard from "./TripChatCard";
import SidebarDetailCard from "./SidebarDetailCard";

export default function GridDetailsLayout({
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
  showDriverRateButton,
  alreadyRatedDriver,
  onRateDriver,
  showPassengerRatingActions,
  hasRated,
  onRatePassenger,
  onReportRide,
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
            showRateButton={showDriverRateButton}
            alreadyRatedDriver={alreadyRatedDriver}
            onRateDriver={onRateDriver}
          />
          <PassengersCard
            passengers={passengers}
            showRatingActions={showPassengerRatingActions}
            hasRated={hasRated}
            onRatePassenger={onRatePassenger}
          />
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
            onClick={onReportRide}
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
