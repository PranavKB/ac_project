import { Modal } from "antd";
import { rideAPI } from "../../api";

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
