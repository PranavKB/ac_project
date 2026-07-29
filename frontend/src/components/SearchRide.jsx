import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationInput from "./LocationInput";
import { rideAPI, routeAPI } from "../../api";
import { Card, Button, DatePicker, Select, Space, Avatar, Badge } from "antd";
import {
  SwapOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
  StarFilled,
  CompassOutlined,
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

  return (
    <Button
      type="primary"
      shape="round"
      size="small"
      disabled={bookingInProgress || seatsLeft <= 0}
      onClick={(e) => {
        e.stopPropagation();
        onBook(match);
      }}
      style={{ fontWeight: 600 }}
    >
      {bookingInProgress ? "Booking..." : "Book"}
    </Button>
  );
}

// --- RideMatchCard Component
export function RideMatchCard({
  match,
  onBook,
  bookingInProgress,
  myBookingStatus,
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
          />
        </Space>
      </div>
    </Card>
  );
}

// --- Horizontal Combined Search Component
export function SearchForm({
  onSearchStart,
  onSearchSuccess,
  onSearchError,
  loading,
  horizontal = true,
}) {
  const [searchDetails, setSearchDetails] = useState(() => {
    try {
      const saved = sessionStorage.getItem("carpool_last_search");
      if (saved)
        return (
          JSON.parse(saved).searchDetails || { source: null, destination: null }
        );
    } catch (e) {
      console.error(e);
    }
    return { source: null, destination: null };
  });
  const [date, setDate] = useState(() => {
    try {
      const saved = sessionStorage.getItem("carpool_last_search");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.date) return dayjs(parsed.date);
      }
    } catch (e) {
      console.error(e);
    }
    return dayjs("2026-07-25");
  });
  const [passengers, setPassengers] = useState(() => {
    try {
      const saved = sessionStorage.getItem("carpool_last_search");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.passengers) return parsed.passengers;
      }
    } catch (e) {
      console.error(e);
    }
    return "1";
  });
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = loading !== undefined ? loading : localLoading;

  const handleSwap = () => {
    setSearchDetails((prev) => ({
      source: prev.destination,
      destination: prev.source,
    }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const { source, destination } = searchDetails;
    if (!source || !destination) {
      alert("Please select both origin and destination locations!");
      return;
    }

    if (onSearchStart) onSearchStart();
    setLocalLoading(true);

    try {
      const requestPayload = {
        sourceCoords: [parseFloat(source.lat), parseFloat(source.lng)],
        destinationCoords: [
          parseFloat(destination.lat),
          parseFloat(destination.lng),
        ],
        departureDate: date ? date.format("YYYY-MM-DD") : null,
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
      if (onSearchError) {
        onSearchError(err.message || "Ride search failed.");
      } else {
        alert(err.message || "Ride search failed.");
      }
    } finally {
      setLocalLoading(false);
    }
  };

  if (!horizontal) {
    return (
      <Card style={{ borderRadius: "16px", padding: "8px" }}>
        <Space orientation="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <div
              style={{ fontWeight: 600, marginBottom: "6px", color: "#054752" }}
            >
              Origin
            </div>
            <LocationInput
              value={searchDetails.source?.name || ""}
              placeholder="Enter origin location..."
              onSelect={(loc) =>
                setSearchDetails((p) => ({ ...p, source: loc }))
              }
            />
          </div>
          <div>
            <div
              style={{ fontWeight: 600, marginBottom: "6px", color: "#054752" }}
            >
              Destination
            </div>
            <LocationInput
              value={searchDetails.destination?.name || ""}
              placeholder="Enter destination location..."
              onSelect={(loc) =>
                setSearchDetails((p) => ({ ...p, destination: loc }))
              }
            />
          </div>
          <Button
            type="primary"
            size="large"
            block
            loading={isLoading}
            onClick={handleSubmit}
            style={{ borderRadius: "12px", height: "48px", fontWeight: 700 }}
          >
            Search Rides
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <div className="combined-search-bar">
      {/* Leaving from */}
      <div className="combined-search-field">
        <LocationInput
          value={searchDetails.source?.name || ""}
          placeholder="Leaving from..."
          onSelect={(loc) => setSearchDetails((p) => ({ ...p, source: loc }))}
          prefix={
            <EnvironmentOutlined
              style={{ color: "#708c91", fontSize: "1.1rem" }}
            />
          }
        />
      </div>

      {/* Swap Button */}
      <Button
        type="text"
        shape="circle"
        icon={<SwapOutlined />}
        onClick={handleSwap}
        style={{ color: "#00aff5", margin: "0 4px" }}
      />

      {/* Going to */}
      <div className="combined-search-field">
        <LocationInput
          value={searchDetails.destination?.name || ""}
          placeholder="Going to..."
          onSelect={(loc) =>
            setSearchDetails((p) => ({ ...p, destination: loc }))
          }
          prefix={
            <CompassOutlined style={{ color: "#708c91", fontSize: "1.1rem" }} />
          }
        />
      </div>

      {/* Date */}
      <div className="combined-search-field" style={{ minWidth: "160px" }}>
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

      {/* Passengers */}
      <div className="combined-search-field" style={{ minWidth: "150px" }}>
        <Space size="small" style={{ width: "100%" }}>
          <UserOutlined style={{ color: "#708c91", fontSize: "1.1rem" }} />
          <Select
            value={passengers}
            onChange={setPassengers}
            variant="borderless"
            style={{ width: "100%", fontWeight: 500, color: "#054752" }}
            options={[
              { value: "1", label: "1 passenger" },
              { value: "2", label: "2 passengers" },
              { value: "3", label: "3 passengers" },
              { value: "4", label: "4 passengers" },
            ]}
          />
        </Space>
      </div>

      {/* Submit Button */}
      <Button
        type="primary"
        loading={isLoading}
        onClick={handleSubmit}
        style={{
          height: "48px",
          padding: "0 28px",
          borderTopLeftRadius: "0",
          borderBottomLeftRadius: "0",
          borderTopRightRadius: "12px",
          borderBottomRightRadius: "12px",
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
