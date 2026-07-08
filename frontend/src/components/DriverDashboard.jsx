/* eslint-disable max-lines-per-function */
import { useState, useEffect } from "react";
import useAuth from "../context/AuthContext/useAuth";
import MapComponent from "./MapComponent";
import PublishRide from "./PublishRide";
import { rideAPI, requestAPI, routeAPI } from "../../api";
import { PlayIcon } from "./icons";

export default function DriverDashboard() {
  const { user } = useAuth();

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

      // Default selected ride to the first active/ongoing ride, or the first in the list
      if (rides.length > 0) {
        const activeRide =
          rides.find((r) => r.status === "ACTIVE" || r.status === "ONGOING") ||
          rides[0];
        setSelectedRide(activeRide);

        // Show selected ride route on the map
        if (activeRide.source && activeRide.destination) {
          const srcCoords = [
            activeRide.source.location.coordinates[0],
            activeRide.source.location.coordinates[1],
          ];
          const destCoords = [
            activeRide.destination.location.coordinates[0],
            activeRide.destination.location.coordinates[1],
          ];

          // Fetch exact route polyline for the map
          const routeCoords = await routeAPI.fetch(
            { lat: srcCoords[0], lng: srcCoords[1] },
            { lat: destCoords[0], lng: destCoords[1] },
          );
          setMapProps({
            source: srcCoords,
            destination: destCoords,
            routeCoords,
          });
        }
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
      const requests = response?.data || response || [];
      setRideRequests(requests);
    } catch (err) {
      console.error("Failed to fetch ride requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch driver's posted rides on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDriverRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch requests for the selected ride
  useEffect(() => {
    if (selectedRide?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRideRequests(selectedRide.id);
    } else {
      setRideRequests([]);
    }
  }, [selectedRide]);

  const handleStartTrip = async () => {
    if (!selectedRide) return;
    try {
      const result = await rideAPI.start(selectedRide.id);

      if (result.status === "SUCCESS") {
        alert("Trip started! Status is now ONGOING.");
        fetchDriverRides();
      } else {
        alert(result.message || "Failed to start trip.");
      }
    } catch (err) {
      console.error("Failed to start trip:", err);
      alert("Failed to start trip.");
    }
  };

  const handleCompleteTrip = async () => {
    if (!selectedRide) return;
    try {
      // 10.0 km for demonstration
      const result = await rideAPI.complete(selectedRide.id, 10.0);

      if (result.status === "SUCCESS") {
        alert(
          "Trip completed successfully! Avoided fuel and carbon footprint computed.",
        );
        fetchDriverRides();
      } else {
        alert(result.message || "Failed to complete trip.");
      }
    } catch (err) {
      console.error("Failed to complete trip:", err);
      alert("Failed to complete trip.");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await requestAPI.approve(requestId);
      alert("Rider request approved!");
      if (selectedRide?.id) {
        fetchRideRequests(selectedRide.id);
        // Reload seats left count
        fetchDriverRides();
      }
    } catch (err) {
      console.error("Failed to accept request:", err);
      alert("Failed to accept request.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await requestAPI.reject(requestId);
      alert("Rider request rejected.");
      if (selectedRide?.id) {
        fetchRideRequests(selectedRide.id);
      }
    } catch (err) {
      console.error("Failed to reject request:", err);
      alert("Failed to reject request.");
    }
  };

  const selectActiveRide = async (ride) => {
    setSelectedRide(ride);
    if (ride.source && ride.destination) {
      const srcCoords = [
        ride.source.location.coordinates[0],
        ride.source.location.coordinates[1],
      ];
      const destCoords = [
        ride.destination.location.coordinates[0],
        ride.destination.location.coordinates[1],
      ];

      const routeCoords = await routeAPI.fetch(
        { lat: srcCoords[0], lng: srcCoords[1] },
        { lat: destCoords[0], lng: destCoords[1] },
      );
      setMapProps({
        source: srcCoords,
        destination: destCoords,
        routeCoords,
      });
    }
  };

  return (
    <div className="dashboard-theme">
      <div className="dashboard-grid">
        {/* Column 1: Post Travel Route & Map */}
        <div className="dashboard-col">
          <div className="dashboard-card">
            <h2>Post Travel Route</h2>
            <PublishRide
              isEmbed={true}
              onPublishSuccess={async (newRide) => {
                await fetchDriverRides();
                if (newRide?.id) {
                  setSelectedRide(newRide);
                }
              }}
              onMapUpdate={(mapData) => setMapProps(mapData)}
            />
          </div>

          <div className="map-wrapper">
            <MapComponent
              source={mapProps.source}
              destination={mapProps.destination}
              routeCoords={mapProps.routeCoords}
              currentLocation={null}
            />
          </div>
        </div>

        {/* Column 2: Trip Actions */}
        <div className="dashboard-col">
          <div className="dashboard-card card-tall">
            <h2>Trip Actions</h2>
            {selectedRide ? (
              <div className="trip-actions-wrapper">
                <div>
                  <h3 className="trip-actions-title">
                    {selectedRide.source?.name.split(",")[0]} to{" "}
                    {selectedRide.destination?.name.split(",")[0]}
                  </h3>
                  <div>
                    <span
                      className={`status-badge ${selectedRide.status?.toLowerCase()}`}
                    >
                      Status: {selectedRide.status}
                    </span>
                  </div>
                </div>

                {selectedRide.status === "ACTIVE" && (
                  <button
                    onClick={handleStartTrip}
                    className="btn-db-action success tall w-full"
                  >
                    <PlayIcon /> Start Trip
                  </button>
                )}

                {selectedRide.status === "ONGOING" && (
                  <button
                    onClick={handleCompleteTrip}
                    className="btn-db-action danger tall w-full"
                  >
                    Complete Trip
                  </button>
                )}

                {selectedRide.status === "COMPLETED" && (
                  <div className="trip-success-box">
                    <h4>Trip Completed Successfully!</h4>
                    <p>
                      Co2 offset avoided:{" "}
                      {selectedRide.executionDetails?.environmentalOffset?.netReducedCo2Kg?.toFixed(
                        2,
                      ) || "0.00"}{" "}
                      Kg
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="empty-text">
                No active trip. Publish a route to start.
              </p>
            )}
          </div>
        </div>

        {/* Column 3: Riders Queue & Posted Routes */}
        <div className="dashboard-col">
          {/* Card 3a: Riders Queue */}
          <div className="dashboard-card card-riders-queue">
            <h2>Riders Queue</h2>
            {loadingRequests ? (
              <p className="empty-text">Loading queue...</p>
            ) : rideRequests.length > 0 ? (
              <div>
                {rideRequests.map((req) => (
                  <div key={req.id} className="list-card">
                    <div className="card-info">
                      <span className="title">{req.passengerName}</span>
                      <span className="subtitle">
                        {req.source?.name.split(",")[0]} to{" "}
                        {req.destination?.name.split(",")[0]}
                      </span>
                      {req.status !== "PENDING" && (
                        <span
                          className={`status-badge ${req.status?.toLowerCase()}`}
                        >
                          {req.status}
                        </span>
                      )}
                    </div>
                    {req.status === "PENDING" && (
                      <div className="card-actions">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="btn-db-action success small"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="btn-db-action danger small"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No riders in queue.</p>
            )}
          </div>

          {/* Card 3b: Posted Routes */}
          <div className="dashboard-card card-posted-routes">
            <h2>Posted Routes</h2>
            {loadingRides ? (
              <p className="empty-text">Loading posted routes...</p>
            ) : postedRides.length > 0 ? (
              <div className="scroll-container">
                {postedRides.map((ride) => (
                  <div
                    key={ride.id}
                    onClick={() => selectActiveRide(ride)}
                    className={`list-card clickable ${selectedRide?.id === ride.id ? "active-route" : ""}`}
                  >
                    <div className="card-info">
                      <span className="title">
                        {ride.source?.name.split(",")[0]} to{" "}
                        {ride.destination?.name.split(",")[0]}
                      </span>
                      <span className="subtitle">
                        {ride.availableSeats} seat(s) left
                      </span>
                    </div>
                    <div>
                      <span
                        className={`status-badge ${ride.status?.toLowerCase()}`}
                      >
                        {ride.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No routes posted.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
