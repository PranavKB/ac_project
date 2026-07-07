/* eslint-disable max-lines-per-function */
import { useState, useEffect } from "react";
import useAuth from "../context/AuthContext/useAuth";
import MapComponent from "./MapComponent";
import PublishRide from "./PublishRide";
import { rideAPI, requestAPI, routeAPI } from "../../api";

export default function DriverDashboard() {
  const { user } = useAuth();

  // Posted rides list and active selected ride
  const [postedRides, setPostedRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Map state
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
      const response = await fetch(
        `http://localhost:8080/api/rides/${selectedRide.id}/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const result = await response.json();
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
      const response = await fetch(
        `http://localhost:8080/api/rides/${selectedRide.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actualDistanceKm: 10.0 }),
        },
      );
      const result = await response.json();
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
        fetchDriverRides(); // Reload seats left count
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

          {/* Map wrapper */}
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
          <div className="dashboard-card" style={{ minHeight: "600px" }}>
            <h2>Trip Actions</h2>
            {selectedRide ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                <div>
                  <h3 style={{ marginBottom: "0.5rem", fontSize: "1.4rem" }}>
                    {selectedRide.source?.name.split(",")[0]} &rarr;{" "}
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
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span>&#9654;</span> Start Trip
                  </button>
                )}

                {selectedRide.status === "ONGOING" && (
                  <button
                    onClick={handleCompleteTrip}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Complete Trip
                  </button>
                )}

                {selectedRide.status === "COMPLETED" && (
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      padding: "1.5rem",
                      borderRadius: "8px",
                      color: "#10b981",
                      textAlign: "center",
                    }}
                  >
                    <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                      Trip Completed Successfully!
                    </h4>
                    <p style={{ fontSize: "0.9rem", color: "#8b949e" }}>
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
          <div className="dashboard-card" style={{ minHeight: "300px" }}>
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
                        {req.source?.name.split(",")[0]} &rarr;{" "}
                        {req.destination?.name.split(",")[0]}
                      </span>
                      {req.status !== "PENDING" && (
                        <span
                          className={`status-badge ${req.status?.toLowerCase()}`}
                          style={{ marginTop: "4px" }}
                        >
                          {req.status}
                        </span>
                      )}
                    </div>
                    {req.status === "PENDING" && (
                      <div className="card-actions">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          style={{
                            background: "#10b981",
                            color: "#fff",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          style={{
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
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
          <div className="dashboard-card" style={{ minHeight: "275px" }}>
            <h2>Posted Routes</h2>
            {loadingRides ? (
              <p className="empty-text">Loading posted routes...</p>
            ) : postedRides.length > 0 ? (
              <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                {postedRides.map((ride) => (
                  <div
                    key={ride.id}
                    onClick={() => selectActiveRide(ride)}
                    className={`list-card clickable ${selectedRide?.id === ride.id ? "active-route" : ""}`}
                  >
                    <div className="card-info">
                      <span className="title">
                        {ride.source?.name.split(",")[0]} &rarr;{" "}
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
