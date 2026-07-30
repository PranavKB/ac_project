import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationInput from "./LocationInput";
import { rideAPI, routeAPI } from "../../api";
import { Card, Button, DatePicker, Space, Avatar, Badge } from "antd";
import {
  SwapOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
  StarFilled,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { calculateRouteDistance } from "../utils/helpers";

const formatRideTimesAndDuration = (ride) => {
  const depDate = ride?.departureTime ? new Date(ride.departureTime) : null;
  const validDepDate = depDate && !isNaN(depDate.getTime()) ? depDate : null;

  const depTime = validDepDate
    ? validDepDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "08:00 AM";

  const distKm =
    ride?.routeCoords?.length >= 2
      ? Math.round(calculateRouteDistance(ride.routeCoords) * 10) / 10
      : 0;

  const durationMins =
    ride?.estimatedDurationMinutes && ride.estimatedDurationMinutes > 0
      ? ride.estimatedDurationMinutes
      : distKm > 0
        ? Math.max(15, Math.round((distKm / 40) * 60))
        : 45;

  const h = Math.floor(durationMins / 60);
  const m = durationMins % 60;
  const durationText = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;

  const arrivalDate = validDepDate
    ? new Date(validDepDate.getTime() + durationMins * 60 * 1000)
    : null;

  const arrTime = arrivalDate
    ? arrivalDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "08:45 AM";

  const priceAmount =
    ride?.pricePerSeat != null && ride.pricePerSeat > 0
      ? `₹${Number(ride.pricePerSeat).toLocaleString("en-IN")}.00`
      : "₹250.00";

  return { depTime, arrTime, durationText, priceAmount };
};

function RenderBookingAction({
  myBookingStatus,
  onBook,
  match,
  bookingInProgress,
  seatsLeft,
  passengerCount = 1,
}) {
  if (myBookingStatus === "PENDING") {
    return (
      <Badge
        count="Request Pending"
        style={{
          backgroundColor: "#fffbe6",
          border: "1px solid #ffe58f",
          color: "#d48806",
          padding: "0 10px",
          fontWeight: 700,
          boxShadow: "none",
        }}
      />
    );
  }
  if (myBookingStatus === "APPROVED" || myBookingStatus === "ACCEPTED") {
    return (
      <Badge
        count="Request Approved"
        style={{
          backgroundColor: "#f6ffed",
          border: "1px solid #b7eb8f",
          color: "#52c41a",
          padding: "0 10px",
          fontWeight: 700,
          boxShadow: "none",
        }}
      />
    );
  }
  if (myBookingStatus === "REJECTED") {
    return (
      <Badge
        count="Request Rejected"
        style={{
          backgroundColor: "#fff2f0",
          border: "1px solid #ffccc7",
          color: "#ff4d4f",
          padding: "0 10px",
          fontWeight: 700,
          boxShadow: "none",
        }}
      />
    );
  }
  if (!onBook) return null;

  const notEnoughSeats = seatsLeft < passengerCount;

  return (
    <Button
      type="primary"
      shape="round"
      size="small"
      disabled={bookingInProgress || seatsLeft <= 0 || notEnoughSeats}
      onClick={(e) => {
        e.stopPropagation();
        onBook(match);
      }}
      style={{ fontWeight: 600 }}
      title={notEnoughSeats ? `Only ${seatsLeft} seat(s) left` : undefined}
    >
      {bookingInProgress
        ? "Booking..."
        : notEnoughSeats
          ? "Not enough seats"
          : "Book"}
    </Button>
  );
}

// --- RideMatchCard Component
export function RideMatchCard({
  match,
  onBook,
  bookingInProgress,
  myBookingStatus,
  passengerCount = 1,
}) {
  const navigate = useNavigate();
  const { ride } = match;
  const driverName = ride?.driverName || "Driver";
  const driverInitial = driverName.charAt(0).toUpperCase();
  const seatsLeft = ride?.availableSeats ?? 2;
  const similarityScore = Math.round((match?.similarityScore || 0.85) * 100);

  const { depTime, arrTime, durationText, priceAmount } =
    formatRideTimesAndDuration(ride);

  const srcName = ride?.source?.name
    ? ride.source.name.split(",")[0]
    : "Origin";
  const destName = ride?.destination?.name
    ? ride.destination.name.split(",")[0]
    : "Destination";

  return (
    <Card
      hoverable
      onClick={() => ride?.id && navigate(`/rides/${ride.id}`)}
      style={{
        borderRadius: "16px",
        border: "1px solid #eef0f2",
        boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
        marginBottom: "16px",
        overflow: "hidden",
      }}
      styles={{ body: { padding: "20px" } }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        {/* Timeline graphics and routes */}
        <div style={{ display: "flex", gap: "24px", flex: 1 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "28px",
              alignItems: "flex-end",
              minWidth: "45px",
            }}
          >
            <span
              style={{ fontSize: "1.1rem", fontWeight: 700, color: "#054752" }}
            >
              {depTime}
            </span>
            <span
              style={{ fontSize: "0.85rem", color: "#708c91", fontWeight: 500 }}
            >
              {durationText}
            </span>
            <span
              style={{ fontSize: "1.1rem", fontWeight: 700, color: "#054752" }}
            >
              {arrTime}
            </span>
          </div>

          <div
            style={{
              position: "relative",
              width: "2px",
              backgroundColor: "#00aff5",
              margin: "8px 0",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-4px",
                left: "-4px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#fff",
                border: "2px solid #00aff5",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-4px",
                left: "-4px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#fff",
                border: "2px solid #00aff5",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "28px",
              flex: 1,
            }}
          >
            <span
              style={{ fontSize: "1.1rem", fontWeight: 700, color: "#054752" }}
            >
              {srcName}
            </span>
            <div style={{ height: "16px" }} />
            <span
              style={{ fontSize: "1.1rem", fontWeight: 700, color: "#054752" }}
            >
              {destName}
            </span>
          </div>
        </div>

        {/* Pricing Column */}
        <div style={{ textAlign: "right", minWidth: "120px" }}>
          <div
            style={{ fontSize: "1.6rem", fontWeight: 800, color: "#054752" }}
          >
            {priceAmount}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#708c91" }}>
            per passenger
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #f6f7f9",
          paddingTop: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Driver profile avatar and rating */}
        <Space size="middle">
          <Badge dot status="processing" offset={[-2, 32]}>
            <Avatar
              style={{
                backgroundColor: "#e6f7ff",
                color: "#00aff5",
                fontWeight: 600,
              }}
              icon={<UserOutlined />}
            >
              {driverInitial}
            </Avatar>
          </Badge>
          <div>
            <div
              style={{ fontWeight: 600, color: "#054752", fontSize: "0.95rem" }}
            >
              {driverName}
            </div>
            <Space size={4} style={{ color: "#faad14", fontSize: "0.8rem" }}>
              <StarFilled />
              <span style={{ fontWeight: 600 }}>4.8</span>
            </Space>
          </div>
        </Space>

        {/* Badges / Instant Book / Similarity */}
        <Space size="small" style={{ flexWrap: "wrap" }}>
          <Badge
            count={`${seatsLeft} seat${seatsLeft !== 1 ? "s" : ""} left`}
            style={{
              backgroundColor: seatsLeft <= 1 ? "#ff4d4f" : "#f5f5f5",
              color: seatsLeft <= 1 ? "#fff" : "#595959",
              boxShadow: "none",
            }}
          />
          <Badge
            count={`${similarityScore}% match`}
            style={{
              backgroundColor: "#e6f7ff",
              color: "#00aff5",
              boxShadow: "none",
            }}
          />
          <RenderBookingAction
            myBookingStatus={myBookingStatus}
            onBook={onBook}
            match={match}
            bookingInProgress={bookingInProgress}
            seatsLeft={seatsLeft}
            passengerCount={passengerCount}
          />
        </Space>
      </div>
    </Card>
  );
}

function PassengerCounterField({ passengers, setPassengers }) {
  const count = parseInt(passengers, 10) || 1;
  return (
    <div
      className="combined-search-field"
      style={{ minWidth: "185px", padding: "0 12px" }}
    >
      <Space
        size="small"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Space size="small">
          <UserOutlined style={{ color: "#708c91", fontSize: "1.1rem" }} />
          <span
            style={{ fontWeight: 600, color: "#054752", fontSize: "0.95rem" }}
          >
            {count} {count === 1 ? "passenger" : "passengers"}
          </span>
        </Space>
        <Space size={4}>
          <Button
            type="text"
            shape="circle"
            size="small"
            icon={
              <MinusOutlined
                style={{
                  fontSize: "11px",
                  color: count <= 1 ? "#ccc" : "#00aff5",
                }}
              />
            }
            disabled={count <= 1}
            onClick={() => setPassengers(String(Math.max(1, count - 1)))}
            style={{ border: "1px solid #d9d9d9" }}
          />
          <Button
            type="text"
            shape="circle"
            size="small"
            icon={
              <PlusOutlined
                style={{
                  fontSize: "11px",
                  color: count >= 8 ? "#ccc" : "#00aff5",
                }}
              />
            }
            disabled={count >= 8}
            onClick={() => setPassengers(String(Math.min(8, count + 1)))}
            style={{ border: "1px solid #d9d9d9" }}
          />
        </Space>
      </Space>
    </div>
  );
}

// --- Horizontal Combined Search Component
export function SearchForm({
  onSearchStart,
  onSearchSuccess,
  onSearchError,
  horizontal = true,
}) {
  const [searchDetails, setSearchDetails] = useState(() => {
    try {
      const saved = sessionStorage.getItem("carpool_last_search");
      if (saved)
        return (
          JSON.parse(saved).searchDetails || { source: null, destination: null }
        );
    } catch {
      // fallback
    }
    return { source: null, destination: null };
  });

  const [date, setDate] = useState(() => {
    try {
      const saved = sessionStorage.getItem("carpool_last_search");
      if (saved && JSON.parse(saved).date) return dayjs(JSON.parse(saved).date);
    } catch {
      // fallback
    }
    return dayjs();
  });

  const [passengers, setPassengers] = useState(() => {
    try {
      const saved = sessionStorage.getItem("carpool_last_search");
      if (saved && JSON.parse(saved).passengers)
        return JSON.parse(saved).passengers;
    } catch {
      // fallback
    }
    return "1";
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSwap = () => {
    setSearchDetails((prev) => ({
      source: prev.destination,
      destination: prev.source,
    }));
  };

  const handleSubmit = async () => {
    const { source, destination } = searchDetails;
    if (!source || !destination) {
      if (onSearchError)
        onSearchError("Please select both source and destination.");
      return;
    }

    setIsLoading(true);
    if (onSearchStart) onSearchStart();

    try {
      const requestPayload = {
        sourceCoords: [parseFloat(source.lat), parseFloat(source.lng)],
        destinationCoords: [
          parseFloat(destination.lat),
          parseFloat(destination.lng),
        ],
        departureDate: date ? date.format("YYYY-MM-DD") : null,
        requestedSeats: parseInt(passengers, 10) || 1,
      };

      const response = await rideAPI.search(requestPayload);
      const ridesArray = response?.data || response || [];

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
          date: date.format("YYYY-MM-DD"),
          passengers,
        });
      }
    } catch (err) {
      if (onSearchError)
        onSearchError(
          err.response?.data?.message ||
            "Failed to search rides. Please try again.",
        );
    } finally {
      setIsLoading(false);
    }
  };

  if (!horizontal) {
    return (
      <Card style={{ borderRadius: "16px", padding: "20px" }}>
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <LocationInput
            placeholder="Leaving from..."
            initialValue={searchDetails.source}
            onSelect={(loc) =>
              setSearchDetails((prev) => ({ ...prev, source: loc }))
            }
          />
          <LocationInput
            placeholder="Going to..."
            initialValue={searchDetails.destination}
            onSelect={(loc) =>
              setSearchDetails((prev) => ({ ...prev, destination: loc }))
            }
          />
          <DatePicker
            value={date}
            onChange={(val) => val && setDate(val)}
            format="YYYY-MM-DD"
            style={{ width: "100%" }}
          />
          <PassengerCounterField
            passengers={passengers}
            setPassengers={setPassengers}
          />
          <Button type="primary" block onClick={handleSubmit}>
            Search Rides
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <div className="combined-search-bar">
      {/* Source */}
      <div className="combined-search-field">
        <LocationInput
          value={searchDetails.source?.name || ""}
          placeholder="Leaving from..."
          onSelect={(loc) =>
            setSearchDetails((prev) => ({ ...prev, source: loc }))
          }
          prefix={
            <EnvironmentOutlined
              style={{ color: "#708c91", fontSize: "1.1rem" }}
            />
          }
        />
      </div>

      {/* Swap */}
      <Button
        type="text"
        shape="circle"
        icon={<SwapOutlined style={{ color: "#00aff5" }} />}
        onClick={handleSwap}
        style={{ margin: "0 -8px", zIndex: 2, backgroundColor: "#fff" }}
      />

      {/* Destination */}
      <div className="combined-search-field">
        <LocationInput
          value={searchDetails.destination?.name || ""}
          placeholder="Going to..."
          onSelect={(loc) =>
            setSearchDetails((prev) => ({ ...prev, destination: loc }))
          }
          prefix={
            <EnvironmentOutlined
              style={{ color: "#00aff5", fontSize: "1.1rem" }}
            />
          }
        />
      </div>

      {/* Date */}
      <div className="combined-search-field">
        <Space size="small" style={{ width: "100%" }}>
          <CalendarOutlined style={{ color: "#708c91", fontSize: "1.1rem" }} />
          <DatePicker
            value={date}
            onChange={(val) => val && setDate(val)}
            format="ddd, D MMM"
            allowClear={false}
            variant="borderless"
            style={{ padding: 0, fontWeight: 500, color: "#054752" }}
          />
        </Space>
      </div>

      {/* Passengers Counter */}
      <PassengerCounterField
        passengers={passengers}
        setPassengers={setPassengers}
      />

      {/* Submit Button */}
      <Button
        type="primary"
        loading={isLoading}
        onClick={handleSubmit}
        style={{
          height: "48px",
          padding: "0 28px",
          borderRadius: "0 12px 12px 0",
          fontWeight: 700,
          fontSize: "1rem",
        }}
      >
        Search
      </Button>
    </div>
  );
}

// --- Main Standalone SearchRide Page Component
export default function SearchRide() {
  const [searchResults, setSearchResults] = useState(() => {
    try {
      const saved = sessionStorage.getItem("carpool_last_search");
      if (saved) return JSON.parse(saved).searchResults || [];
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(() => searchResults.length > 0);

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
    <div style={{ padding: "40px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1
          style={{
            fontSize: "2.6rem",
            fontWeight: 800,
            color: "#054752",
            marginBottom: "24px",
          }}
        >
          Find a ride
        </h1>
        <SearchForm
          loading={loading}
          onSearchStart={handleSearchStart}
          onSearchSuccess={handleSearchSuccess}
          onSearchError={handleSearchError}
        />
        {error && (
          <p style={{ color: "#ff4d4f", marginTop: "12px" }}>{error}</p>
        )}
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {searchResults.length > 0 ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#054752",
                }}
              >
                Available Rides
              </span>
              <span style={{ color: "#708c91", fontWeight: 600 }}>
                {searchResults.length} rides available
              </span>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {searchResults.map((match, idx) => (
                <RideMatchCard key={idx} match={match} />
              ))}
            </div>
          </div>
        ) : (
          !loading &&
          searched && (
            <div
              style={{
                textAlign: "center",
                marginTop: "40px",
                color: "#708c91",
              }}
            >
              No matching rides found for this route selection.
            </div>
          )
        )}
      </div>
    </div>
  );
}
