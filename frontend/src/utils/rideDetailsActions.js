import { Modal } from "antd";
import { rideAPI, requestAPI, userAPI } from "../../api";
import { getRequestedSeatCount } from "./rideDetailsHelpers";

export const fetchRideDetailsData = async (
  id,
  { setLoading, setError, setRide, setPassengers, setDriverProfile },
  fetchRatings,
) => {
  setLoading(true);
  setError(null);
  try {
    const resp = await rideAPI.get(id);
    const rideData = resp?.data || resp;
    setRide(rideData);
    const reqResp = await requestAPI.getByRide(id).catch(() => null);
    setPassengers(reqResp?.data || reqResp || []);
    if (rideData?.driverId) {
      const driverResp = await userAPI.get(rideData.driverId).catch(() => null);
      setDriverProfile(driverResp?.data || driverResp || null);
    }
    fetchRatings();
  } catch {
    setError("Failed to load ride details.");
  } finally {
    setLoading(false);
  }
};

export const executeRideAction = async (actionFn, successMsg, callback) => {
  try {
    const result = await actionFn();
    if (result.success) {
      Modal.success({ title: "Success", content: successMsg });
      callback();
    }
  } catch (err) {
    console.error(err);
    Modal.error({ title: "Error", content: "Failed to perform action." });
  }
};

export const requestRideBooking = async (
  ride,
  user,
  navigate,
  setBookingInProgress,
  fetchRideData,
) => {
  if (!user?.data?.id) {
    Modal.info({
      title: "Login Required",
      content: "Please login to book a ride!",
      onOk: () => navigate("/login"),
    });
    return;
  }
  setBookingInProgress(true);
  try {
    const passengerCount = getRequestedSeatCount();

    const reqData = {
      rideId: ride.id,
      passengerId: user.data.id,
      passengerName: user.data.name,
      source: ride.source,
      destination: ride.destination,
      passengerH3Segments: [],
      requestedSeats: passengerCount,
    };
    await requestAPI.create(reqData);
    Modal.success({
      title: "Booking Requested",
      content: "Booking request submitted successfully!",
    });
    fetchRideData();
  } catch (err) {
    Modal.error({
      title: "Booking Failed",
      content:
        err.response?.data?.message || "Failed to submit booking request.",
    });
  } finally {
    setBookingInProgress(false);
  }
};
