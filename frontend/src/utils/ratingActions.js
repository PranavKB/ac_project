import { Modal } from "antd";
import { ratingAPI } from "../../api";

export const fetchRideRatings = async (rideId, setRatings) => {
  try {
    const resp = await ratingAPI.getByRide(rideId);
    setRatings(resp?.data || resp || []);
  } catch {
    // Non-critical: rating buttons just won't know about past ratings.
  }
};

export const submitRating = async (
  ride,
  user,
  ratingTarget,
  values,
  form,
  { setSubmittingRating, setRatingTarget, fetchRatings },
) => {
  if (!ratingTarget || !user?.data?.id) return;
  setSubmittingRating(true);
  try {
    await ratingAPI.create({
      rideId: ride.id,
      reviewerId: user.data.id,
      reviewedUserId: ratingTarget.id,
      textReview: values.textReview,
      metrics: {
        punctualityFactor: values.punctualityFactor,
        cancellationConsistency: values.cancellationConsistency,
        safeDrivingAssessment: values.safeDrivingAssessment,
        rideCompletionSuccess: values.rideCompletionSuccess,
        uniformRoutineConsistency: values.uniformRoutineConsistency,
        vehicleCleanlinessMetric: values.vehicleCleanlinessMetric,
        communicationQualityFeedback: values.communicationQualityFeedback,
      },
    });
    Modal.success({
      title: "Thank you!",
      content: `Your rating for ${ratingTarget.name} has been submitted.`,
    });
    setRatingTarget(null);
    form.resetFields();
    fetchRatings();
  } catch (err) {
    Modal.error({
      title: "Rating failed",
      content: err.response?.data?.message || "Could not submit your rating.",
    });
  } finally {
    setSubmittingRating(false);
  }
};
