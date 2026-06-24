import { useState } from "react";
import LocationInput from "../components/LocationInput";
import { rideAPI, routeAPI } from "../../api";
/* eslint-disable no-unused-vars, max-lines-per-function */
const rideDetailsInitialState = {
  driverId: null,
  driverName: null,
  totalSeats: 4,
  departureTime: "",
  source: null,
  destination: null,
};

const getRequestBody = (rideDetails) => ({
  driverId: "6a3aabf5752b7b75f246d300",
  driverName: "John Doe",
  totalSeats: rideDetails.totalSeats,
  departureTime: `${rideDetails.departureTime}:00Z`,
  source: {
    name: rideDetails.source.name,
    location: {
      type: "Point",
      coordinates: [rideDetails.source.lat, rideDetails.source.lng],
    },
  },
  destination: {
    name: rideDetails.destination.name,
    location: {
      type: "Point",
      coordinates: [rideDetails.destination.lat, rideDetails.destination.lng],
    },
  },
});

export default function PublishRide({ onMapUpdate }) {
  const [rideDetails, setRideDetails] = useState(rideDetailsInitialState);
  const [isPreviewing, setIsPreviewing] = useState(false);

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
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !rideDetails.source ||
      !rideDetails.destination ||
      !rideDetails.departureTime
    ) {
      alert("Please fill out all required fields!");
      return;
    }

    const requestBody = getRequestBody(rideDetails);

    try {
      const response = await rideAPI.create(requestBody);
      console.log("Ride published successfully:", response);

      // After publish, keep the published route visible on the map
      if (onMapUpdate) {
        const routeCoords = await routeAPI.fetch(
          rideDetails.source,
          rideDetails.destination,
        );
        onMapUpdate({
          source: [rideDetails.source.lat, rideDetails.source.lng],
          destination: [
            rideDetails.destination.lat,
            rideDetails.destination.lng,
          ],
          routeCoords,
        });
      }

      alert("Ride published successfully!");
    } catch (error) {
      console.error("Error publishing ride:", error);
      alert("Failed to publish ride.");
    }
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "40px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h2>Publish a Ride</h2>

      <form onSubmit={handleSubmit}>
        <label>
          <b>From:</b>
        </label>
        <LocationInput
          placeholder="Enter source location..."
          onSelect={(location) =>
            setRideDetails((prev) => ({ ...prev, source: location }))
          }
        />

        <label>
          <b>To:</b>
        </label>
        <LocationInput
          placeholder="Enter destination location..."
          onSelect={(location) =>
            setRideDetails((prev) => ({ ...prev, destination: location }))
          }
        />

        {/* Preview Route */}
        {/* <button
          type="button"
          onClick={handlePreview}
          disabled={
            !rideDetails.source || !rideDetails.destination || isPreviewing
          }
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            background:
              !rideDetails.source || !rideDetails.destination
                ? "#ccc"
                : "#17a2b8",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "15px",
            cursor:
              !rideDetails.source || !rideDetails.destination
                ? "not-allowed"
                : "pointer",
          }}
        >
          {isPreviewing ? "Loading preview..." : "Preview Route"}
        </button> */}

        {/* Departure Time */}
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              fontSize: "0.85rem",
              color: "var(--color-text-secondary)",
              display: "block",
              marginBottom: 4,
            }}
          >
            Departure Time
          </label>
          <input
            type="datetime-local"
            className="input-field"
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

        <div style={{ marginBottom: "20px" }}>
          <label>
            <b>Available Seats:</b>
          </label>
          <input
            type="number"
            min="1"
            max="8"
            value={rideDetails.totalSeats}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            onChange={(e) =>
              setRideDetails((prev) => ({
                ...prev,
                totalSeats: parseInt(e.target.value, 10) || 1,
              }))
            }
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Publish Ride
        </button>
      </form>
    </div>
  );
}
