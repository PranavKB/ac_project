import { useState } from "react";
import LocationInput from "./LocationInput";
import { rideAPI, routeAPI } from "../../api";
import useAuth from "../context/AuthContext/useAuth";

const rideDetailsInitialState = {
  totalSeats: 4,
  departureTime: "",
  source: null,
  destination: null,
};

function RideForm({
  rideDetails,
  setRideDetails,
  resetKey,
  isPreviewing,
  isPublishing,
  handlePreview,
  handleSubmit,
}) {
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Source Address</label>
        <LocationInput
          key={`source-${resetKey}`}
          placeholder="Enter source location..."
          onSelect={(location) =>
            setRideDetails((prev) => ({ ...prev, source: location }))
          }
        />
      </div>

      <div className="form-group">
        <label>Destination Address</label>
        <LocationInput
          key={`dest-${resetKey}`}
          placeholder="Enter destination location..."
          onSelect={(location) =>
            setRideDetails((prev) => ({ ...prev, destination: location }))
          }
        />
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Seats Available</label>
          <input
            type="number"
            min="1"
            max="8"
            value={rideDetails.totalSeats}
            onChange={(e) =>
              setRideDetails((prev) => ({
                ...prev,
                totalSeats: parseInt(e.target.value, 10) || 1,
              }))
            }
          />
        </div>
        <div className="form-group" style={{ flex: 1.5 }}>
          <label>Departure Time</label>
          <input
            type="datetime-local"
            value={rideDetails.departureTime}
            onChange={(e) =>
              setRideDetails((prev) => ({
                ...prev,
                departureTime: e.target.value,
              }))
            }
            required
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
        <button
          type="button"
          className="nav-btn"
          onClick={handlePreview}
          disabled={
            !rideDetails.source || !rideDetails.destination || isPreviewing
          }
          style={{
            flex: 1,
            padding: "12px",
            border: "1px solid #30363d",
            borderRadius: "6px",
            fontWeight: 600,
            cursor:
              !rideDetails.source || !rideDetails.destination
                ? "not-allowed"
                : "pointer",
          }}
        >
          {isPreviewing ? "Loading Preview..." : "Preview Route"}
        </button>
        <button
          type="submit"
          disabled={isPublishing}
          style={{
            flex: 1.2,
            padding: "12px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: isPublishing ? "not-allowed" : "pointer",
          }}
        >
          {isPublishing ? "Publishing..." : "Publish Trip"}
        </button>
      </div>
    </form>
  );
}

export default function PublishRide({
  onPublishSuccess,
  onMapUpdate,
  isEmbed = false,
}) {
  const [rideDetails, setRideDetails] = useState(rideDetailsInitialState);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const { user } = useAuth();

  const handlePreview = async () => {
    const { source, destination } = rideDetails;
    if (!source || !destination) {
      alert("Please select both source and destination first.");
      return;
    }
    setIsPreviewing(true);
    try {
      const routeCoords = await routeAPI.fetch(source, destination);
      if (onMapUpdate) {
        onMapUpdate({
          source: [source.lat, source.lng],
          destination: [destination.lat, destination.lng],
          routeCoords,
        });
      }
    } catch (err) {
      console.error("Route preview failed:", err);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { source, destination, totalSeats, departureTime } = rideDetails;

    if (!source || !destination || !departureTime) {
      alert("Please fill out all required fields!");
      return;
    }

    setIsPublishing(true);
    try {
      const requestBody = {
        driverId: user.data.id,
        driverName: user.data.name,
        totalSeats: parseInt(totalSeats, 10) || 1,
        departureTime: `${departureTime}:00Z`,
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
      };

      const response = await rideAPI.create(requestBody);
      const newRide = response?.data || response;
      alert("Ride published successfully!");

      setRideDetails(rideDetailsInitialState);
      setResetKey((prev) => prev + 1);

      if (onPublishSuccess) {
        await onPublishSuccess(newRide);
      }
    } catch (error) {
      console.error("Error publishing ride:", error);
      alert("Failed to publish ride.");
    } finally {
      setIsPublishing(false);
    }
  };

  const formContent = (
    <RideForm
      rideDetails={rideDetails}
      setRideDetails={setRideDetails}
      resetKey={resetKey}
      isPreviewing={isPreviewing}
      isPublishing={isPublishing}
      handlePreview={handlePreview}
      handleSubmit={handleSubmit}
    />
  );

  if (isEmbed) {
    return formContent;
  }

  return (
    <div
      className="dashboard-theme"
      style={{
        maxWidth: "500px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <div className="dashboard-card">
        <h2>Publish a Ride</h2>
        {formContent}
      </div>
    </div>
  );
}
