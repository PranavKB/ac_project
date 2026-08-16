import { Modal } from "antd";
import { userAPI, rideAPI, requestAPI } from "../../api";

export const updateUserProfile = async (userId, updatePayload, options) => {
  const { successMsg, setOpen, callback } = options;
  try {
    await userAPI.update(userId, updatePayload);
    Modal.success({ title: "Updated", content: successMsg });
    setOpen(false);
    callback();
  } catch (err) {
    console.error(err);
    Modal.error({ title: "Error", content: "Failed to update profile." });
  }
};

// For drivers, trips are Ride documents and already carry their own status
// and price. For passengers, trips are RideRequest documents, which don't
// store the ride's current status or price - so each request is enriched
// with its underlying ride's status/pricePerSeat here.
export const fetchUserTrips = async (userId, isDriverMode) => {
  if (isDriverMode) {
    const rides = await rideAPI.getByDriver(userId);
    return rides?.data || rides || [];
  }

  const reqs = await requestAPI.getByPassenger(userId);
  const requests = reqs?.data || reqs || [];

  return Promise.all(
    requests.map(async (req) => {
      if (!req.rideId) return req;
      try {
        const rideResp = await rideAPI.get(req.rideId);
        const ride = rideResp?.data || rideResp;
        return {
          ...req,
          rideStatus: ride?.status,
          pricePerSeat: ride?.pricePerSeat,
        };
      } catch {
        return req;
      }
    }),
  );
};
