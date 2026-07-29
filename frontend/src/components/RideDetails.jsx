import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { rideAPI, messageAPI } from "../../api";
import {
  parseRideTimesAndLocations,
  parseDriverProfile,
  getRequestedSeatCount,
} from "../utils/rideDetailsHelpers";
import {
  fetchRideDetailsData,
  executeRideAction,
  requestRideBooking,
} from "../utils/rideDetailsActions";
import { fetchRideRatings, submitRating } from "../utils/ratingActions";
import { submitReport } from "../utils/reportActions";
import useAuth from "../context/AuthContext/useAuth";
import RatingModal from "./rideDetails/RatingModal";
import ReportRideModal from "./rideDetails/ReportRideModal";
import GridDetailsLayout from "./rideDetails/GridDetailsLayout";
import {
  RideDetailsLoadingView,
  RideDetailsErrorView,
} from "./rideDetails/RideDetailsStates";
import { Button, Typography, Modal } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function RideDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, activeRole, refreshUser } = useAuth();

  const [ride, setRide] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Chat message states
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Rating states
  const [ratings, setRatings] = useState([]);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Report states
  const [reportTarget, setReportTarget] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchRatings = () => fetchRideRatings(id, setRatings);

  const fetchRideData = () =>
    fetchRideDetailsData(
      id,
      { setLoading, setError, setRide, setPassengers, setDriverProfile },
      fetchRatings,
    );

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

  const hasRated = (reviewedUserId) =>
    ratings.some(
      (r) =>
        r.reviewerId === user?.data?.id && r.reviewedUserId === reviewedUserId,
    );

  const handleSubmitRating = (values, form) =>
    submitRating(ride, user, ratingTarget, values, form, {
      setSubmittingRating,
      setRatingTarget,
      fetchRatings,
    });

  const handleSubmitReport = (values, form) =>
    submitReport(ride, user, values, form, {
      setSubmittingReport,
      setReportTarget,
    });

  useEffect(() => {
    if (id) {
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

  const { driverRating, driverVehicle, driverSmokingPreference } =
    parseDriverProfile(driverProfile);
  const requestedSeatCount = getRequestedSeatCount();

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

  const rideCompleted = ride.status === "COMPLETED";
  const showDriverRateButton =
    !isDriver && rideCompleted && bookingStatus === "APPROVED";
  const alreadyRatedDriver = hasRated(ride.driverId);
  const showPassengerRatingActions = isDriver && rideCompleted;

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
        driverRating={driverRating}
        driverVehicle={driverVehicle}
        driverSmokingPreference={driverSmokingPreference}
        requestedSeatCount={requestedSeatCount}
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
        showDriverRateButton={showDriverRateButton}
        alreadyRatedDriver={alreadyRatedDriver}
        onRateDriver={() =>
          setRatingTarget({ id: ride.driverId, name: driverName })
        }
        showPassengerRatingActions={showPassengerRatingActions}
        hasRated={hasRated}
        onRatePassenger={(p) =>
          setRatingTarget({
            id: p.passengerId,
            name: p.passengerName || "Passenger",
          })
        }
        onReportRide={() => setReportTarget(ride)}
      />
      <RatingModal
        target={ratingTarget}
        onCancel={() => setRatingTarget(null)}
        onSubmit={handleSubmitRating}
        submitting={submittingRating}
      />
      <ReportRideModal
        target={reportTarget}
        onCancel={() => setReportTarget(null)}
        onSubmit={handleSubmitReport}
        submitting={submittingReport}
      />
    </div>
  );
}
