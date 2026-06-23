import { useState } from "react";
import LocationInput from "../components/LocationInput";
import { rideAPI } from "../../api";

const rideDetailsInitialState = {
  driverId: null,
  driverName: null,
  totalSeats: 4,
  departureTime: "",
  source: null,
  destination: null,
};

export default function PublishRide() {
  const [rideDetails, setRideDetails] = useState(rideDetailsInitialState);

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

    console.log("Publishing Ride with details:", rideDetails);

    const requestBody = {
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
          coordinates: [
            rideDetails.destination.lat,
            rideDetails.destination.lng,
          ],
        },
      },
    };

    console.log("Publishing Ride Data Payload:", requestBody);
    try {
      const response = await rideAPI.create(requestBody);
      console.log("Ride published successfully:", response);
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

        {/* Departure Time element using datetime-local field input */}
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
