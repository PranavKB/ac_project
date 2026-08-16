import { Modal } from "antd";
import { reportAPI } from "../../api";

export const submitReport = async (
  ride,
  user,
  values,
  form,
  { setSubmittingReport, setReportTarget },
) => {
  if (!ride || !user?.data?.id) return;
  setSubmittingReport(true);
  try {
    await reportAPI.create({
      rideId: ride.id,
      reporterId: user.data.id,
      reportedUserId: ride.driverId,
      reason: values.reason,
      details: values.details,
    });
    Modal.success({
      title: "Report submitted",
      content: "Thank you - our team will review this ride.",
    });
    setReportTarget(null);
    form.resetFields();
  } catch (err) {
    Modal.error({
      title: "Report failed",
      content: err.response?.data?.message || "Could not submit your report.",
    });
  } finally {
    setSubmittingReport(false);
  }
};
