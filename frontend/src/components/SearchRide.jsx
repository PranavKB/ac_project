import { useState } from "react";
import LocationInput from "./LocationInput";
import { rideAPI, routeAPI } from "../../api";

// --- RideMatchCard Component
export function RideMatchCard({ match, onBook, bookingInProgress }) {
  const { ride } = match;
  return (
    <div className="list-card">
      <div className="card-info">
        <span className="title">Driver: {ride?.driverName || "Driver"}</span>
        <span className="subtitle">Seats Left: {ride?.availableSeats}</span>
        <span className="badge-text">
          {Math.round((match.similarityScore || 0) * 100)}% Route Overlap
        </span>
      </div>
      {onBook && (
        <div className="card-actions">
          <button
            className="book-btn"
            disabled={bookingInProgress || ride?.availableSeats <= 0}
            onClick={() => onBook(match)}
          >
            {bookingInProgress ? "Booking..." : "Book Ride"}
          </button>
        </div>
      )}
    </div>
  );
}

// --- SearchForm Component
export function SearchForm({
  onSearchStart,
  onSearchSuccess,
  onSearchError,
  loading,
}) {
  const [searchDetails, setSearchDetails] = useState({
    source: null,
    destination: null,
  });
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = loading !== undefined ? loading : localLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { source, destination } = searchDetails;
    if (!source || !destination) {
      alert("Please select both source and destination locations!");
      return;
    }

    if (onSearchStart) onSearchStart();
    setLocalLoading(true);

    try {
      // Need to mirror my PublishRide layout exactly here: map source.lat and source.lng directly
      const requestPayload = {
        sourceCoords: [parseFloat(source.lat), parseFloat(source.lng)],
        destinationCoords: [
          parseFloat(destination.lat),
          parseFloat(destination.lng),
        ],
      };

      console.log("Submitting aligned search payload:", requestPayload);
      const response = await rideAPI.search(requestPayload);

      // Need to safely pull the list out of my backend's Response Wrapper Object
      const ridesArray = response?.data || response || [];

      // Fetch route polyline for map if possible
      let routeCoords = null;
      try {
        routeCoords = await routeAPI.fetch(source, destination);
      } catch (routeErr) {
        console.error("Failed to fetch route coords:", routeErr);
      }

      if (onSearchSuccess) {
        onSearchSuccess({
          searchDetails,
          searchResults: ridesArray,
          routeCoords,
        });
      }
    } catch (err) {
      if (onSearchError) {
        onSearchError(err.message || "Ride search failed.");
      } else {
        alert(err.message || "Ride search failed.");
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Origin</label>
        <LocationInput
          placeholder="Enter origin address..."
          onSelect={(loc) => setSearchDetails((p) => ({ ...p, source: loc }))}
        />
      </div>
      <div className="form-group">
        <label>Destination</label>
        <LocationInput
          placeholder="Enter destination address..."
          onSelect={(loc) =>
            setSearchDetails((p) => ({ ...p, destination: loc }))
          }
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: "100%",
          padding: "12px",
          background: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontWeight: 600,
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.7 : 1,
          transition: "background-color 0.2s ease",
        }}
      >
        {isLoading ? "Searching Matching Rides..." : "Search Matching Rides"}
      </button>
    </form>
  );
}

// --- Main Standalone SearchRide Page Component
export default function SearchRide() {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearchStart = () => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    setSearched(true);
  };

  const handleSearchSuccess = ({ searchResults }) => {
    setSearchResults(searchResults);
    setLoading(false);
  };

  const handleSearchError = (err) => {
    setError(err);
    setLoading(false);
  };

  return (
    <div className="dashboard-theme" style={{ padding: "40px 20px" }}>
      <div className="dashboard-focus-one-col">
        <div className="dashboard-card" style={{ marginBottom: "20px" }}>
          <h2>Search Travel Opportunities</h2>
          <SearchForm
            loading={loading}
            onSearchStart={handleSearchStart}
            onSearchSuccess={handleSearchSuccess}
            onSearchError={handleSearchError}
          />
          {error && (
            <p
              style={{
                color: "#ef4444",
                marginTop: "10px",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {searchResults.length > 0 ? (
          <div className="dashboard-card">
            <h3 style={{ marginTop: 0, marginBottom: "15px" }}>
              Compatible Matches (Overlapping &gt;= 70%)
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {searchResults.map((match, idx) => (
                <RideMatchCard key={idx} match={match} />
              ))}
            </div>
          </div>
        ) : (
          !loading &&
          searched && (
            <p
              style={{
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.9rem",
              }}
            >
              No matching rides found for this route selection.
            </p>
          )
        )}
      </div>
    </div>
  );
}
