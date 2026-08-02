import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/AuthContext/useAuth";
import MapComponent from "./MapComponent";
import { requestAPI, rideAPI } from "../../api";
import { SearchForm, RideMatchCard } from "./SearchRide";
import {
  Card,
  Radio,
  Checkbox,
  Tag,
  Button,
  Modal,
  Space,
  Empty,
  Typography,
  Row,
  Col,
} from "antd";
import {
  ClockCircleOutlined,
  TagOutlined,
  StarOutlined,
  SafetyOutlined,
  AlertOutlined,
  CloseCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// --- Helper components and logic to satisfy max-lines-per-function rule ---

const readSessionSearch = () => {
  try {
    const saved = sessionStorage.getItem("carpool_last_search");
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error("Failed to parse saved search state:", err);
  }
  return null;
};

const fetchPassengerBookings = async (userId) => {
  if (!userId) return [];
  try {
    const response = await requestAPI.getByPassenger(userId);
    const bookingsList = response?.data || response || [];

    return await Promise.all(
      bookingsList.map(async (booking) => {
        try {
          if (booking.rideId) {
            const ride = await rideAPI.get(booking.rideId);
            const rData = ride?.data || ride;
            return {
              ...booking,
              rideStatus: rData?.status || "UNKNOWN",
              pricePerSeat:
                rData?.pricePerSeat != null
                  ? rData.pricePerSeat
                  : booking.pricePerSeat,
              ride: rData,
            };
          }
        } catch (err) {
          console.error("Failed to enrich booking:", booking.id, err);
        }
        return { ...booking, rideStatus: "UNKNOWN" };
      }),
    );
  } catch (err) {
    console.error("Failed to fetch passenger bookings:", err);
    return [];
  }
};

const saveSearchToSession = (data, newMapProps) => {
  try {
    sessionStorage.setItem(
      "carpool_last_search",
      JSON.stringify({
        searchResults: data.searchResults || [],
        searchDetails: data.searchDetails,
        searchedRoute: data.routeCoords,
        mapProps: newMapProps,
        date: data.date,
        passengers: data.passengers,
      }),
    );
  } catch (err) {
    console.error("Failed to save search to session:", err);
  }
};

const filterAndSortRides = (
  searchResults,
  verifiedFilter,
  departureFilter,
  sortBy,
) => {
  const filtered = searchResults.filter((match) => {
    if (!verifiedFilter) return false;
    const depTimeStr = match.ride?.departureTime;
    if (!depTimeStr) return true;
    const hour = new Date(depTimeStr).getHours();

    if (departureFilter.morning || departureFilter.evening) {
      const morningMatch = departureFilter.morning && hour >= 6 && hour < 12;
      const eveningMatch = departureFilter.evening && hour >= 18;
      return morningMatch || eveningMatch;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === "price")
      return (a.ride?.pricePerSeat || 0) - (b.ride?.pricePerSeat || 0);
    if (sortBy === "rating")
      return (b.driverReputationAvg ?? 80) - (a.driverReputationAvg ?? 80);
    const timeA = new Date(a.ride?.departureTime || 0).getTime();
    const timeB = new Date(b.ride?.departureTime || 0).getTime();
    return timeA - timeB;
  });
};

const getDepartureCounts = (searchResults) => {
  let morning = 0;
  let evening = 0;
  searchResults.forEach((match) => {
    const depTimeStr = match.ride?.departureTime;
    if (depTimeStr) {
      const hour = new Date(depTimeStr).getHours();
      if (hour >= 6 && hour < 12) morning++;
      if (hour >= 18) evening++;
    }
  });
  return { morning, evening };
};

const buildLocationPoint = (loc) => ({
  name: loc.name,
  location: {
    type: "Point",
    // GeoJSON order: [longitude, latitude]
    coordinates: [parseFloat(loc.lng), parseFloat(loc.lat)],
  },
});

const cancelPassengerBooking = async (requestId, callback) => {
  try {
    await requestAPI.cancel(requestId);
    Modal.success({
      title: "Booking Cancelled",
      content: "Your booking request has been cancelled.",
    });
    callback();
  } catch {
    Modal.error({
      title: "Error",
      content: "Failed to cancel your booking request.",
    });
  }
};

function FilterSidebarCard({
  sortBy,
  setSortBy,
  clearFilters,
  departureFilter,
  setDepartureFilter,
  searchedRoute,
  morningCount,
  eveningCount,
  verifiedFilter,
  setVerifiedFilter,
  setShowMapModal,
  mapProps,
}) {
  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      {/* Map box */}
      <Card
        cover={
          <div
            style={{
              position: "relative",
              height: "140px",
              overflow: "hidden",
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&q=80"
              alt="Map preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.15)",
              }}
            >
              <Button
                type="primary"
                shape="round"
                onClick={() => setShowMapModal(true)}
                disabled={!mapProps.source}
                style={{ fontWeight: 600 }}
              >
                Open Route Map
              </Button>
            </div>
          </div>
        }
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #eef0f2",
        }}
      />

      {/* Sort Section */}
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "1rem", fontWeight: 700, color: "#054752" }}
            >
              Sort by
            </span>
            <Button
              type="link"
              size="small"
              onClick={clearFilters}
              style={{ padding: 0 }}
            >
              Clear all
            </Button>
          </div>
        }
        style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
      >
        <Radio.Group
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ width: "100%" }}
        >
          <Space orientation="vertical" style={{ width: "100%" }} size="middle">
            <Radio
              value="earliest"
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Space>
                <ClockCircleOutlined /> Earliest departure
              </Space>
            </Radio>
            <Radio
              value="price"
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Space>
                <TagOutlined /> Lowest price
              </Space>
            </Radio>
            <Radio
              value="rating"
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Space>
                <StarOutlined /> Highest rated driver
              </Space>
            </Radio>
          </Space>
        </Radio.Group>
      </Card>

      {/* Departure Time check boxes */}
      <Card
        title={
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "#054752" }}>
            Departure time
          </span>
        }
        style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
      >
        <Space orientation="vertical" style={{ width: "100%" }} size="middle">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Checkbox
              checked={departureFilter.morning}
              onChange={(e) =>
                setDepartureFilter((p) => ({ ...p, morning: e.target.checked }))
              }
            >
              06:00 - 12:00
            </Checkbox>
            {searchedRoute && (
              <Tag style={{ borderRadius: "999px" }}>{morningCount}</Tag>
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Checkbox
              checked={departureFilter.evening}
              onChange={(e) =>
                setDepartureFilter((p) => ({ ...p, evening: e.target.checked }))
              }
            >
              After 18:00
            </Checkbox>
            {searchedRoute && (
              <Tag style={{ borderRadius: "999px" }}>{eveningCount}</Tag>
            )}
          </div>
        </Space>
      </Card>

      {/* Safety Card */}
      <Card
        title={
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "#054752" }}>
            Trust and safety
          </span>
        }
        style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Checkbox
            checked={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.checked)}
          >
            Verified Profile
          </Checkbox>
          <SafetyOutlined style={{ color: "#05b76d", fontSize: "1.1rem" }} />
        </div>
      </Card>
    </Space>
  );
}

function SearchResultsCard({
  sortedResults,
  searchError,
  searchResults,
  bookings,
  bookingInProgressId,
  handleBookRide,
  passengerCount,
}) {
  return (
    <Card
      title={
        <span style={{ color: "#054752", fontWeight: 800 }}>
          Available Shared Rides ({sortedResults.length})
        </span>
      }
      style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
    >
      {searchError ? (
        <div
          style={{
            display: "flex",
            gap: "10px",
            color: "#ff4d4f",
            padding: "12px 0",
          }}
        >
          <AlertOutlined />
          <Text type="danger">{searchError}</Text>
        </div>
      ) : sortedResults.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {sortedResults.map((match) => {
            const existingBooking = bookings.find(
              (b) => b.rideId === match.ride.id && b.status !== "CANCELLED",
            );
            const myBookingStatus = existingBooking
              ? existingBooking.status
              : null;

            return (
              <RideMatchCard
                key={match.ride.id}
                match={match}
                bookingInProgress={bookingInProgressId === match.ride.id}
                myBookingStatus={myBookingStatus}
                onBook={handleBookRide}
                passengerCount={passengerCount}
              />
            );
          })}
        </div>
      ) : (
        <Empty
          description={
            searchResults.length > 0
              ? "No matches found with current filter choices."
              : "Enter origin and destination locations above to search for rides."
          }
        />
      )}
    </Card>
  );
}

function MyBookingsCard({
  bookings,
  user,
  handleCancelBooking,
  onNavigateToRide,
  onBackToSearch,
}) {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <Card
        title={
          <Title level={3} style={{ margin: 0, color: "#054752" }}>
            My Bookings
          </Title>
        }
        extra={
          <Button
            icon={<SearchOutlined />}
            shape="round"
            onClick={onBackToSearch}
          >
            Back to Search
          </Button>
        }
        style={{
          borderRadius: "16px",
          border: "1px solid #eef0f2",
          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
        }}
      >
        {bookings.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {bookings.map((booking) => (
              <div
                key={booking.id}
                style={{ borderBottom: "1px solid #f6f7f9", padding: "20px 0" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        margin: "0 0 4px",
                        color: "#054752",
                      }}
                    >
                      Ride with{" "}
                      {booking.passengerName === user.data.name
                        ? "Driver"
                        : booking.passengerName}
                    </h4>
                    <Text
                      type="secondary"
                      style={{ fontSize: "0.9rem", fontWeight: 500 }}
                    >
                      {booking.source?.name?.split(",")[0]} to{" "}
                      {booking.destination?.name?.split(",")[0]}
                    </Text>
                  </div>
                  {(() => {
                    const effectiveStatus =
                      booking.status === "APPROVED"
                        ? booking.rideStatus === "COMPLETED"
                          ? "COMPLETED"
                          : booking.rideStatus === "ONGOING"
                            ? "ONGOING"
                            : "APPROVED"
                        : booking.status;

                    const tagColor =
                      effectiveStatus === "COMPLETED"
                        ? "success"
                        : effectiveStatus === "ONGOING"
                          ? "processing"
                          : effectiveStatus === "APPROVED"
                            ? "success"
                            : effectiveStatus === "PENDING"
                              ? "warning"
                              : "error";

                    return (
                      <Tag
                        color={tagColor}
                        style={{
                          borderRadius: "999px",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          padding: "4px 12px",
                        }}
                      >
                        {effectiveStatus}
                      </Tag>
                    );
                  })()}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                  }}
                >
                  <Button
                    type="default"
                    shape="round"
                    onClick={() =>
                      booking.rideId && onNavigateToRide(booking.rideId)
                    }
                    style={{ fontWeight: 600 }}
                  >
                    View Details & Chat
                  </Button>
                  {(booking.status === "PENDING" ||
                    booking.status === "APPROVED") && (
                    <Button
                      danger
                      type="text"
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleCancelBooking(booking.id)}
                      style={{ fontWeight: 600 }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="No bookings found." />
        )}
      </Card>
    </div>
  );
}

function SearchHeaderSection({
  loadingSearch,
  onSearchStart,
  onSearchSuccess,
  onSearchError,
}) {
  return (
    <div
      style={{
        background: "rgba(0,175,245,0.02)",
        padding: "40px 24px",
        borderRadius: "24px",
        marginBottom: "40px",
        border: "1px solid rgba(0,175,245,0.05)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <Title level={2} style={{ color: "#054752", fontWeight: 800 }}>
          Find a ride in seconds
        </Title>
        <Text type="secondary" style={{ fontSize: "1rem" }}>
          Verified drivers.
        </Text>
      </div>
      <SearchForm
        loading={loadingSearch}
        onSearchStart={onSearchStart}
        onSearchSuccess={onSearchSuccess}
        onSearchError={onSearchError}
      />
    </div>
  );
}

// --- Main component ---

export default function PassengerDashboard({ defaultView = "all" }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const savedSearch = readSessionSearch();
  const passengerCount = parseInt(savedSearch?.passengers || "1", 10) || 1;

  const [searchDetails, setSearchDetails] = useState(
    () => savedSearch?.searchDetails || { source: null, destination: null },
  );
  const [searchResults, setSearchResults] = useState(
    () => savedSearch?.searchResults || [],
  );
  const [bookings, setBookings] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [bookingInProgressId, setBookingInProgressId] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [searchedRoute, setSearchedRoute] = useState(
    () => savedSearch?.searchedRoute || null,
  );

  // Filters state
  const [sortBy, setSortBy] = useState("earliest");
  const [departureFilter, setDepartureFilter] = useState({
    morning: false,
    evening: false,
  });
  const [verifiedFilter, setVerifiedFilter] = useState(true);

  // Map state
  const [mapProps, setMapProps] = useState(
    () =>
      savedSearch?.mapProps || {
        source: null,
        destination: null,
        routeCoords: null,
      },
  );

  const loadBookings = async () => {
    if (!user?.data?.id) return;
    const list = await fetchPassengerBookings(user.data.id);
    setBookings(list);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleBookRide = async (match) => {
    const { source, destination } = searchDetails;
    if (!source || !destination || !user?.data?.id) return;
    setBookingInProgressId(match.ride.id);

    try {
      const reqData = {
        rideId: match.ride.id,
        passengerId: user.data.id,
        passengerName: user.data.name,
        source: buildLocationPoint(source),
        destination: buildLocationPoint(destination),
        passengerH3Segments: [],
        requestedSeats: passengerCount,
      };

      await requestAPI.create(reqData);
      Modal.success({
        title: "Booking Request Sent!",
        content:
          "Your travel request was created successfully. The driver will review it shortly.",
        onOk: () => loadBookings(),
      });
    } catch (err) {
      Modal.error({
        title: "Booking Failed",
        content:
          err.response?.data?.message || "Failed to create booking request.",
      });
    } finally {
      setBookingInProgressId(null);
    }
  };

  const handleCancelBooking = (requestId) =>
    cancelPassengerBooking(requestId, loadBookings);

  const clearFilters = () => {
    setSortBy("earliest");
    setDepartureFilter({ morning: false, evening: false });
    setVerifiedFilter(true);
  };

  const handleSearchStart = () => {
    setLoadingSearch(true);
    setSearchError(null);
  };

  const handleSearchSuccess = async (data) => {
    setSearchResults(data.searchResults || []);
    setSearchDetails(data.searchDetails);
    setSearchedRoute(data.routeCoords);
    const newMapProps = data.routeCoords
      ? {
          source: [
            data.searchDetails.source.lat,
            data.searchDetails.source.lng,
          ],
          destination: [
            data.searchDetails.destination.lat,
            data.searchDetails.destination.lng,
          ],
          routeCoords: data.routeCoords,
        }
      : { source: null, destination: null, routeCoords: null };
    setMapProps(newMapProps);
    setLoadingSearch(false);
    saveSearchToSession(data, newMapProps);
  };

  const handleSearchError = (err) => {
    setSearchError(err);
    setLoadingSearch(false);
  };

  const sortedResults = filterAndSortRides(
    searchResults,
    verifiedFilter,
    departureFilter,
    sortBy,
  );
  const { morning: morningCount, evening: eveningCount } =
    getDepartureCounts(searchResults);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "30px 24px" }}>
      {defaultView !== "bookings" && (
        <SearchHeaderSection
          loadingSearch={loadingSearch}
          onSearchStart={handleSearchStart}
          onSearchSuccess={handleSearchSuccess}
          onSearchError={handleSearchError}
        />
      )}

      {defaultView !== "bookings" ? (
        <Row gutter={[32, 32]}>
          <Col xs={24} md={8} lg={7}>
            <FilterSidebarCard
              sortBy={sortBy}
              setSortBy={setSortBy}
              clearFilters={clearFilters}
              departureFilter={departureFilter}
              setDepartureFilter={setDepartureFilter}
              searchedRoute={searchedRoute}
              morningCount={morningCount}
              eveningCount={eveningCount}
              verifiedFilter={verifiedFilter}
              setVerifiedFilter={setVerifiedFilter}
              setShowMapModal={setShowMapModal}
              mapProps={mapProps}
            />
          </Col>

          <Col xs={24} md={16} lg={17}>
            <SearchResultsCard
              sortedResults={sortedResults}
              searchError={searchError}
              searchResults={searchResults}
              bookings={bookings}
              bookingInProgressId={bookingInProgressId}
              handleBookRide={handleBookRide}
              passengerCount={passengerCount}
            />
          </Col>
        </Row>
      ) : (
        <MyBookingsCard
          bookings={bookings.filter(
            (b) =>
              b.status === "PENDING" ||
              b.status === "APPROVED" ||
              b.status === "COMPLETED",
          )}
          user={user}
          handleCancelBooking={handleCancelBooking}
          onNavigateToRide={(rideId) => navigate(`/rides/${rideId}`)}
          onBackToSearch={() => navigate("/passenger/search")}
        />
      )}

      <Modal
        open={showMapModal}
        onCancel={() => setShowMapModal(false)}
        footer={null}
        width={950}
        destroyOnClose
        centered
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: "20px", overflow: "hidden" }}
      >
        <div style={{ width: "100%", height: "600px", position: "relative" }}>
          <MapComponent
            source={mapProps.source}
            destination={mapProps.destination}
            routeCoords={mapProps.routeCoords}
          />
        </div>
      </Modal>
    </div>
  );
}
