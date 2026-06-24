import { useState } from "react";
import LocationInput from "../components/LocationInput";
import { rideAPI } from "../../api";

const initialState = { source: null, destination: null };

// --- Function 1: Match Card Renderer (Under 30 lines) ---
function RideMatchCard({ match }) {
  const { ride } = match;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px",
        border: "1px solid #eee",
        borderRadius: "6px",
        background: "#fafafa",
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>Driver: {ride.driverName}</div>
        <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "2px" }}>
          Seats left: {ride.availableSeats}
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: "#28a745",
            marginTop: "2px",
            fontWeight: 500,
          }}
        >
          {Math.round(match.similarityScore * 100)}% Route Overlap
        </div>
      </div>
    </div>
  );
}

// --- Function 2: Isolated Search Input Form layout (Under 40 lines) ---
function SearchForm({ loading, onSearch, onSelectLocation }) {
  return (
    <form onSubmit={onSearch}>
      <div style={{ marginBottom: "15px" }}>
        <label>
          <b>From:</b>
        </label>
        <LocationInput
          placeholder="Enter source location..."
          onSelect={(loc) => onSelectLocation("source", loc)}
        />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <label>
          <b>To:</b>
        </label>
        <LocationInput
          placeholder="Enter destination location..."
          onSelect={(loc) => onSelectLocation("destination", loc)}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          background: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Calculating Match Vectors..." : "Search Matching Rides"}
      </button>
    </form>
  );
}

// --- Function 3: Main Engine Orchestrator (Under 75 lines) ---
export default function SearchRide() {
  const [searchDetails, setSearchDetails] = useState(initialState);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const { source, destination } = searchDetails;
    if (!source || !destination) {
      alert("Please select both source and destination locations!");
      return;
    }
    setLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      //Need to mirror my PublishRide layout exactly here: map source.lat and source.lng directly
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
      setSearchResults(ridesArray);
    } catch (err) {
      setError(err.message || "Ride search failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2>Search Travel Opportunities</h2>
        <SearchForm
          loading={loading}
          onSearch={handleSearch}
          onSelectLocation={(field, loc) =>
            setSearchDetails((p) => ({ ...p, [field]: loc }))
          }
        />
        {error && (
          <p style={{ color: "red", marginTop: "10px", fontSize: "0.9rem" }}>
            {error}
          </p>
        )}
      </div>

      {searchResults.length > 0 ? (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
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
        searchDetails.source && (
          <p style={{ textAlign: "center", color: "#666", fontSize: "0.9rem" }}>
            No matching rides found for this route selection.
          </p>
        )
      )}
    </div>
  );
}
