import { Modal } from "antd";
import dayjs from "dayjs";
import { rideAPI } from "../../api";

const ACTIVE_RIDE_STATUSES = ["ACTIVE", "ONGOING"];

// Returns the "YYYY-MM-DD" dates (within the departureTime..toDate range) that
// collide with an already-published ride at the exact same time of day -
// mirrors the same-driver/same-slot check enforced server-side, but catches it
// before a network round-trip.
export const findConflictingDates = (values, postedRides) => {
  if (!values.departureTime) return [];

  const existingSlots = new Set(
    (postedRides || [])
      .filter((r) => ACTIVE_RIDE_STATUSES.includes(r.status) && r.departureTime)
      .map((r) => dayjs(r.departureTime).format("YYYY-MM-DD HH:mm")),
  );

  const timeOfDay = values.departureTime.format("HH:mm");
  const startDate = values.departureTime.startOf("day");
  const endDate = values.toDate ? values.toDate.startOf("day") : startDate;

  const conflicts = [];
  for (let d = startDate; !d.isAfter(endDate); d = d.add(1, "day")) {
    if (existingSlots.has(`${d.format("YYYY-MM-DD")} ${timeOfDay}`)) {
      conflicts.push(d.format("YYYY-MM-DD"));
    }
  }
  return conflicts;
};

const buildLocationPayload = (location) => ({
  name: location.name,
  location: {
    type: "Point",
    // GeoJSON order: [longitude, latitude]
    coordinates: [parseFloat(location.lng), parseFloat(location.lat)],
  },
});

export const buildRidePayload = (
  values,
  user,
  sourceLocation,
  destinationLocation,
) => ({
  driverId: user.data.id,
  driverName: user.data.name,
  totalSeats: parseInt(values.totalSeats, 10) || 1,
  departureTime: values.departureTime.toISOString(),
  toDate: values.toDate ? values.toDate.format("YYYY-MM-DD") : null,
  estimatedDurationMinutes: parseInt(values.estimatedDurationMinutes, 10) || 0,
  pricePerSeat: values.pricePerSeat ? parseFloat(values.pricePerSeat) : null,
  source: buildLocationPayload(sourceLocation),
  destination: buildLocationPayload(destinationLocation),
});

export const publishRide = async (
  values,
  user,
  sourceLocation,
  destinationLocation,
  { form, setSourceLocation, setDestinationLocation, onPublishSuccess },
) => {
  const payload = buildRidePayload(
    values,
    user,
    sourceLocation,
    destinationLocation,
  );
  const response = await rideAPI.createMultiDay(payload);
  const newRides = response?.data || response || [];
  const rideCount = Array.isArray(newRides) ? newRides.length : 1;

  Modal.success({
    title: "Ride Published!",
    content:
      rideCount > 1
        ? `${rideCount} rides were created, one for each day from ${payload.departureTime.slice(0, 10)} to ${payload.toDate}, and are now active for passenger matching.`
        : "Your ride was created successfully and is now active for passenger matching.",
  });

  form.resetFields();
  setSourceLocation(null);
  setDestinationLocation(null);

  if (onPublishSuccess) {
    await onPublishSuccess(Array.isArray(newRides) ? newRides[0] : newRides);
  }
};
