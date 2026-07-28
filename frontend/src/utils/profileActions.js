import { Modal } from "antd";
import { userAPI } from "../../api";

export const updateUserProfile = async (userId, updatePayload, options) => {
  const {
    govtIdVerified,
    emailVerified,
    phoneVerified,
    successMsg,
    setOpen,
    callback,
  } = options;
  try {
    await userAPI.update(userId, {
      ...updatePayload,
      isGovtIdVerified: govtIdVerified,
      isEmailVerified: emailVerified,
      isPhoneVerified: phoneVerified,
    });
    Modal.success({ title: "Updated", content: successMsg });
    setOpen(false);
    callback();
  } catch (err) {
    console.error(err);
    Modal.error({ title: "Error", content: "Failed to update profile." });
  }
};
