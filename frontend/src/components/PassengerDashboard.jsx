/* eslint-disable max-lines-per-function */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/AuthContext/useAuth";
import LocationInput from "./LocationInput";
import MapComponent from "./MapComponent";
import { rideAPI, requestAPI, routeAPI } from "../../api";
import "./PassengerDashboard.scss";

export default function PassengerDashboard({ defaultView = "all" }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search details state
  const [searchDetails, setSearchDetails] = useState({
    source: null,
    destination: null,
  });

  const [searchResults, setSearchResults] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingInProgressId, setBookingInProgressId] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Map state
  const [mapProps, setMapProps] = useState({
    source: null,
    destination: null,
    routeCoords: null,
  });

  const fetchBookings = async () => {
    if (!user?.data?.id) return;
    setLoadingBookings(true);
    try {
      const response = await requestAPI.getByPassenger(user.data.id);
      // Backend wrapper check
      const bookingsList = response?.data || response || [];
      setBookings(bookingsList);
    } catch (err) {
      console.error("Failed to fetch passenger bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Load passenger bookings on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const { source, destination } = searchDetails;
    if (!source || !destination) {
      alert("Please select both source and destination locations!");
      return;
    }

    setLoadingSearch(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const requestPayload = {
        sourceCoords: [parseFloat(source.lat), parseFloat(source.lng)],
        destinationCoords: [
          parseFloat(destination.lat),
          parseFloat(destination.lng),
        ],
      };

      // Search rides
      const response = await rideAPI.search(requestPayload);
      const ridesArray = response?.data || response || [];
      setSearchResults(ridesArray);

      // Fetch route polyline for the map
      const routeCoords = await routeAPI.fetch(source, destination);
      setMapProps({
        source: [source.lat, source.lng],
        destination: [destination.lat, destination.lng],
        routeCoords,
      });
    } catch (err) {
      setSearchError(err.message || "Ride search failed.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleBookRide = async (match) => {
    const { source, destination } = searchDetails;
    if (!source || !destination || !user?.data?.id) return;

    setBookingInProgressId(match.ride.id);

    try {
      const reqData = {
        rideId: match.ride.id,
        passengerId: user.data.id,
        passengerName: user.data.name,
        source: {
          name: source.name,
          location: {
            type: "Point",
            coordinates: [parseFloat(source.lat), parseFloat(source.lng)],
          },
        },
        destination: {
          name: destination.name,
          location: {
            type: "Point",
            coordinates: [
              parseFloat(destination.lat),
              parseFloat(destination.lng),
            ],
          },
        },
        passengerH3Segments: [],
      };

      await requestAPI.create(reqData);
      alert("Booking request sent successfully!");
      fetchBookings(); // Reload bookings
    } catch (err) {
      console.error("Booking failed:", err);
      alert(err.response?.data?.message || "Failed to create booking request.");
    } finally {
      setBookingInProgressId(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (
      !window.confirm("Are you sure you want to cancel this booking request?")
    )
      return;

    try {
      await requestAPI.cancel(bookingId);
      alert("Booking request cancelled.");
      fetchBookings();
    } catch (err) {
      console.error("Cancel failed:", err);
      alert("Failed to cancel booking request.");
    }
  };

  // Helper for view selection class
  const getNavClass = (viewName) => {
    return defaultView === viewName ? "nav-btn active" : "nav-btn";
  };

  return (
    <div className="dashboard-theme">
      {/* Route Navigation Links */}
      <div className="dashboard-navigation">
        <button
          className={getNavClass("all")}
          onClick={() => navigate("/passenger")}
        >
          All Panels
        </button>
        <button
          className={getNavClass("search")}
          onClick={() => navigate("/passenger/search")}
        >
          Search &amp; Map
        </button>
        <button
          className={getNavClass("bookings")}
          onClick={() => navigate("/passenger/bookings")}
        >
          Booking Records ({bookings.length})
        </button>
      </div>

      {/* Unified 3-Column Layout */}
      {defaultView === "all" && (
        <div className="dashboard-grid">
          {/* Column 1: Search & Map */}
          <div className="dashboard-col">
            <div className="dashboard-card">
              <h2>Search Travel Opportunities</h2>
              <form onSubmit={handleSearch}>
                <div className="form-group">
                  <label>Origin</label>
                  <LocationInput
                    placeholder="Enter origin address..."
                    onSelect={(loc) =>
                      setSearchDetails((prev) => ({ ...prev, source: loc }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <LocationInput
                    placeholder="Enter destination address..."
                    onSelect={(loc) =>
                      setSearchDetails((prev) => ({
                        ...prev,
                        destination: loc,
                      }))
                    }
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingSearch}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: loadingSearch ? "not-allowed" : "pointer",
                    opacity: loadingSearch ? 0.7 : 1,
                    transition: "background-color 0.2s ease",
                  }}
                >
                  {loadingSearch
                    ? "Searching Matching Rides..."
                    : "Search Matching Rides"}
                </button>
              </form>
              {searchError && (
                <p
                  style={{
                    color: "#ef4444",
                    marginTop: "12px",
                    fontSize: "0.9rem",
                  }}
                >
                  {searchError}
                </p>
              )}
            </div>

            {/* Map */}
            <div className="map-wrapper">
              <MapComponent
                source={mapProps.source}
                destination={mapProps.destination}
                routeCoords={mapProps.routeCoords}
                currentLocation={null}
              />
            </div>
          </div>

          {/* Column 2: Compatible Matches */}
          <div className="dashboard-col">
            <div className="dashboard-card" style={{ minHeight: "600px" }}>
              <h2>Compatible Matches (Similarity &gt;= 70%)</h2>
              {searchResults.length > 0 ? (
                <div>
                  {searchResults.map((match, idx) => (
                    <div key={idx} className="list-card">
                      <div className="card-info">
                        <span className="title">
                          Driver: {match.ride?.driverName || "Driver"}
                        </span>
                        <span className="subtitle">
                          Seats Left: {match.ride?.availableSeats}
                        </span>
                        <span className="badge-text">
                          {Math.round((match.similarityScore || 0) * 100)}%
                          Route Overlap
                        </span>
                      </div>
                      <div className="card-actions">
                        <button
                          className="book-btn"
                          disabled={
                            bookingInProgressId === match.ride?.id ||
                            match.ride?.availableSeats <= 0
                          }
                          onClick={() => handleBookRide(match)}
                        >
                          {bookingInProgressId === match.ride?.id
                            ? "Booking..."
                            : "Book Ride"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-text">
                  Search for a route to view matches.
                </p>
              )}
            </div>
          </div>

          {/* Column 3: Booking Records */}
          <div className="dashboard-col">
            <div className="dashboard-card" style={{ minHeight: "600px" }}>
              <h2>Booking Records</h2>
              {loadingBookings ? (
                <p className="empty-text">Loading booking records...</p>
              ) : bookings.length > 0 ? (
                <div>
                  {bookings.map((booking) => (
                    <div key={booking.id} className="list-card">
                      <div className="card-info">
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <span className="title">
                            Ride with{" "}
                            {booking.passengerName === user.data.name
                              ? "Driver"
                              : booking.passengerName}
                          </span>
                          <span
                            className={`status-badge ${booking.status?.toLowerCase()}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <span className="subtitle" style={{ marginTop: "4px" }}>
                          From: {booking.source?.name?.split(",")[0]} &rarr; To:{" "}
                          {booking.destination?.name?.split(",")[0]}
                        </span>
                      </div>
                      <div className="card-actions">
                        {(booking.status === "PENDING" ||
                          booking.status === "APPROVED") && (
                          <button
                            className="cancel-btn"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-text">No travel requests found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Focus View 1: Search & Map */}
      {defaultView === "search" && (
        <div className="dashboard-focus-two-col">
          <div className="dashboard-card">
            <h2>Search Travel Opportunities</h2>
            <form onSubmit={handleSearch}>
              <div className="form-group">
                <label>Origin</label>
                <LocationInput
                  placeholder="Enter origin address..."
                  onSelect={(loc) =>
                    setSearchDetails((prev) => ({ ...prev, source: loc }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Destination</label>
                <LocationInput
                  placeholder="Enter destination address..."
                  onSelect={(loc) =>
                    setSearchDetails((prev) => ({ ...prev, destination: loc }))
                  }
                />
              </div>
              <button
                type="submit"
                disabled={loadingSearch}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  cursor: loadingSearch ? "not-allowed" : "pointer",
                  opacity: loadingSearch ? 0.7 : 1,
                  transition: "background-color 0.2s ease",
                }}
              >
                {loadingSearch
                  ? "Searching Matching Rides..."
                  : "Search Matching Rides"}
              </button>
            </form>
            {searchError && (
              <p
                style={{
                  color: "#ef4444",
                  marginTop: "12px",
                  fontSize: "0.9rem",
                }}
              >
                {searchError}
              </p>
            )}

            {searchResults.length > 0 && (
              <div style={{ marginTop: "2rem" }}>
                <h3>Compatible Matches (Similarity &gt;= 70%)</h3>
                <div>
                  {searchResults.map((match, idx) => (
                    <div key={idx} className="list-card">
                      <div className="card-info">
                        <span className="title">
                          Driver: {match.ride?.driverName || "Driver"}
                        </span>
                        <span className="subtitle">
                          Seats Left: {match.ride?.availableSeats}
                        </span>
                        <span className="badge-text">
                          {Math.round((match.similarityScore || 0) * 100)}%
                          Route Overlap
                        </span>
                      </div>
                      <div className="card-actions">
                        <button
                          className="book-btn"
                          disabled={
                            bookingInProgressId === match.ride?.id ||
                            match.ride?.availableSeats <= 0
                          }
                          onClick={() => handleBookRide(match)}
                        >
                          {bookingInProgressId === match.ride?.id
                            ? "Booking..."
                            : "Book Ride"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="map-wrapper" style={{ height: "600px" }}>
            <MapComponent
              source={mapProps.source}
              destination={mapProps.destination}
              routeCoords={mapProps.routeCoords}
              currentLocation={null}
            />
          </div>
        </div>
      )}

      {/* Focus View 2: Booking Records */}
      {defaultView === "bookings" && (
        <div className="dashboard-focus-one-col">
          <div className="dashboard-card">
            <h2>Booking Records</h2>
            {loadingBookings ? (
              <p className="empty-text">Loading booking records...</p>
            ) : bookings.length > 0 ? (
              <div>
                {bookings.map((booking) => (
                  <div key={booking.id} className="list-card">
                    <div className="card-info">
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        <span className="title">
                          Ride with{" "}
                          {booking.passengerName === user.data.name
                            ? "Driver"
                            : booking.passengerName}
                        </span>
                        <span
                          className={`status-badge ${booking.status?.toLowerCase()}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <span className="subtitle" style={{ marginTop: "4px" }}>
                        From: {booking.source?.name} &rarr; To:{" "}
                        {booking.destination?.name}
                      </span>
                    </div>
                    <div className="card-actions">
                      {(booking.status === "PENDING" ||
                        booking.status === "APPROVED") && (
                        <button
                          className="cancel-btn"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No travel requests found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
