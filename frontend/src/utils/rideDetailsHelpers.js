import { calculateRouteDistance } from "./helpers";

// Mirrors CarbonService.java: distKm × 0.08 L/km × 2.33 kg/L × passengerCount
const FUEL_PER_KM = 0.08;
const CO2_PER_LITER = 2.33;

function calculateCo2(distanceKm, passengerCount) {
  const avoided = distanceKm * FUEL_PER_KM * Math.max(1, passengerCount);
  return Math.round(avoided * CO2_PER_LITER * 100) / 100;
}

export const parseRideTimesAndLocations = (ride, passengerCount = 1) => {
  if (!ride) return {};
  const srcName = ride.source?.name ? ride.source.name.split(",")[0] : "Origin";
  const srcFull = ride.source?.name || "Detailed address not specified";
  const destName = ride.destination?.name
    ? ride.destination.name.split(",")[0]
    : "Destination";
  const destFull = ride.destination?.name || "Detailed address not specified";

  const depTime = ride.departureTime
    ? new Date(ride.departureTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  // Derive arrival time from departureTime + estimatedDurationMinutes
  const arrTime = (() => {
    if (!ride.departureTime || !ride.estimatedDurationMinutes) return "N/A";
    const arrival = new Date(
      new Date(ride.departureTime).getTime() +
        ride.estimatedDurationMinutes * 60 * 1000,
    );
    return arrival.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  // Format estimatedDurationMinutes → "Xh Ym" / "Ym"
  const mins = ride.estimatedDurationMinutes;
  let durationText = "N/A";
  if (mins && mins > 0) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    durationText = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
  }

  const priceAmount = ride.pricePerSeat
    ? `₹${ride.pricePerSeat.toLocaleString("en-IN")}.00`
    : "N/A";

  const formattedDate = ride.departureTime
    ? new Date(ride.departureTime).toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "N/A";

  // Compute distance from stored route coordinates
  const distanceKm =
    ride.routeCoords?.length >= 2
      ? Math.round(calculateRouteDistance(ride.routeCoords) * 10) / 10
      : 0;

  // For COMPLETED rides use the authoritative backend-stored value;
  // for ACTIVE/ONGOING show a frontend estimate as a preview.
  const co2Kg =
    ride.status === "COMPLETED" &&
    ride.executionDetails?.environmentalOffset?.netReducedCo2Kg != null
      ? ride.executionDetails.environmentalOffset.netReducedCo2Kg
      : calculateCo2(distanceKm, passengerCount);

  return {
    srcName,
    srcFull,
    destName,
    destFull,
    depTime,
    arrTime,
    durationText,
    priceAmount,
    formattedDate,
    distanceKm,
    co2Kg,
  };
};

// Reads the party size chosen on the search form (SearchRide.jsx) from the last
// saved search session, so the ride-details "Book Ride" flow books the same
// number of seats the passenger searched for.
export const getRequestedSeatCount = () => {
  try {
    const savedSearch = sessionStorage.getItem("carpool_last_search");
    if (savedSearch) {
      const parsed = JSON.parse(savedSearch);
      if (parsed?.passengers) {
        return parseInt(parsed.passengers, 10) || 1;
      }
    }
  } catch (err) {
    console.error("Failed to read passenger count from session:", err);
  }
  return 1;
};

// Reputation scores are stored on a 0-100 scale; convert to a familiar 0-5 star rating.
export const parseDriverProfile = (driverProfile) => {
  const reputation = driverProfile?.reputationProfile;
  const driverRating = reputation
    ? (
        (reputation.trustScore +
          reputation.reliabilityScore +
          reputation.comfortScore) /
        3 /
        20
      ).toFixed(1)
    : null;

  return {
    driverRating,
    driverVehicle: driverProfile?.vehicleDetails,
    driverSmokingPreference: driverProfile?.preferences?.smoking,
  };
};
