import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../context/AuthContext/useAuth";
import OfferARide from "./driver/OfferARide";
import PostedTrips from "./driver/PostedTrips";
import Bookings from "./driver/Bookings";
import { rideAPI, requestAPI } from "../../api";
import { calculateRouteDistance } from "../utils/helpers";
import { updateMapRoute, executeDriverAction } from "../utils/driverActions";
import { Tabs, Badge, Modal } from "antd";

const EMPTY_MAP_PROPS = { source: null, destination: null, routeCoords: null };

export default function DriverDashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "publish";
  const setActiveTab = (tabName) => setSearchParams({ tab: tabName });

  const [postedRides, setPostedRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Kept separate from the "Offer a Ride" preview map so an existing posted
  // trip's route never bleeds into the publish form's map before the driver
  // has picked their own origin/destination there.
  const [postedTripMapProps, setPostedTripMapProps] = useState(EMPTY_MAP_PROPS);
  const [publishMapProps, setPublishMapProps] = useState(EMPTY_MAP_PROPS);

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
          setPostedTripMapProps,
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
      () => {
        fetchDriverRides();
        refreshUser();
      },
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
    await updateMapRoute(ride.source, ride.destination, setPostedTripMapProps);
  };

  const pendingRequests = rideRequests
    .filter((r) => r.status === "PENDING")
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
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
              <OfferARide
                onPublishSuccess={async (newRide) => {
                  await fetchDriverRides();
                  if (newRide?.id) setSelectedRide(newRide);
                  setActiveTab("posted");
                  setPublishMapProps(EMPTY_MAP_PROPS);
                }}
                onMapUpdate={setPublishMapProps}
                mapProps={publishMapProps}
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
              <PostedTrips
                postedRides={postedRides}
                loadingRides={loadingRides}
                selectedRide={selectedRide}
                selectActiveRide={selectActiveRide}
                mapProps={postedTripMapProps}
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
              <Bookings
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
