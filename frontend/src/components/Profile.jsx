import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/AuthContext/useAuth";
import { userAPI } from "../../api";
import { updateUserProfile, fetchUserTrips } from "../utils/profileActions";
import PersonalDetailsModal from "./profile/PersonalDetailsModal";
import BioModal from "./profile/BioModal";
import PreferencesModal from "./profile/PreferencesModal";
import VehicleModal from "./profile/VehicleModal";
import AboutTabContent from "./profile/AboutTabContent";
import AccountTabContent from "./profile/AccountTabContent";
import { LoadingView, ErrorView } from "./profile/ProfileStates";
import { Tabs, Button, Form } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function Profile() {
  const { user, activeRole, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile data states
  const [bio, setBio] = useState("");
  const [preferences, setPreferences] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [reputation, setReputation] = useState(null);
  const [userTrips, setUserTrips] = useState([]);
  const [carbonSaved, setCarbonSaved] = useState(0);

  // Form states for modals
  const [aboutForm] = Form.useForm();
  const [bioForm] = Form.useForm();
  const [prefsForm] = Form.useForm();
  const [vehicleForm] = Form.useForm();

  // Modal Open States
  const [editAboutOpen, setEditAboutOpen] = useState(false);
  const [editBioOpen, setEditBioOpen] = useState(false);
  const [editPrefsOpen, setEditPrefsOpen] = useState(false);
  const [editVehicleOpen, setEditVehicleOpen] = useState(false);

  const isDriverMode = activeRole === "DRIVER";

  const fetchProfileData = async () => {
    if (!user?.data?.id) return void setLoading(false);
    setLoading(true);
    setError(null);
    try {
      const uDetails = await userAPI.get(user.data.id);
      const data = uDetails?.data || uDetails;

      setBio(data.bio || "");
      setPreferences(data.preferences || {});
      setVehicle(data.vehicleDetails || {});
      setReputation(data.reputationProfile || {});
      setCarbonSaved(data.totalCarbonSavedKg || 0);

      aboutForm.setFieldsValue({
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
      bioForm.setFieldsValue({ bio: data.bio });
      prefsForm.setFieldsValue(data.preferences || {});
      vehicleForm.setFieldsValue(data.vehicleDetails || {});

      setUserTrips(await fetchUserTrips(user.data.id, isDriverMode));
    } catch (err) {
      console.error("Failed to load profile details:", err);
      setError("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUpdateDetails = (values) =>
    updateUserProfile(user.data.id, values, {
      successMsg: "Personal details updated successfully!",
      setOpen: setEditAboutOpen,
      callback: fetchProfileData,
    });

  const handleUpdateBio = (values) =>
    updateUserProfile(
      user.data.id,
      { bio: values.bio },
      {
        successMsg: "Bio updated successfully!",
        setOpen: setEditBioOpen,
        callback: fetchProfileData,
      },
    );

  const handleUpdatePreferences = (values) =>
    updateUserProfile(
      user.data.id,
      { preferences: values },
      {
        successMsg: "Travel preferences updated!",
        setOpen: setEditPrefsOpen,
        callback: fetchProfileData,
      },
    );

  const handleUpdateVehicle = (values) =>
    updateUserProfile(
      user.data.id,
      { vehicleDetails: values },
      {
        successMsg: "Vehicle details updated successfully!",
        setOpen: setEditVehicleOpen,
        callback: fetchProfileData,
      },
    );

  if (loading || !user) return <LoadingView />;
  if (error) return <ErrorView error={error} onGoBack={() => navigate(-1)} />;

  const avatarInitial = user.data.name
    ? user.data.name.charAt(0).toUpperCase()
    : "U";
  const memberSince = user.data.createdAt
    ? new Date(user.data.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  // Calculating profile completeness metric
  let completionItems = 0;
  if (user.data.name) completionItems += 25;
  if (bio) completionItems += 25;
  // Email is always verified — logging in requires the registered email.
  completionItems += 25;
  if (preferences && Object.keys(preferences).length > 0) completionItems += 25;
  const profileCompletion = completionItems;

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto", padding: "30px 24px" }}>
      <Button
        onClick={() => navigate(-1)}
        icon={<ArrowLeftOutlined />}
        style={{
          borderRadius: "9999px",
          fontWeight: 700,
          marginBottom: "24px",
        }}
      >
        Back
      </Button>

      <Tabs
        centered
        items={[
          {
            key: "about",
            label: (
              <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                About you
              </span>
            ),
            children: (
              <AboutTabContent
                user={user}
                avatarInitial={avatarInitial}
                profileCompletion={profileCompletion}
                bio={bio}
                preferences={preferences}
                vehicle={vehicle}
                isDriverMode={isDriverMode}
                setEditAboutOpen={setEditAboutOpen}
                setEditBioOpen={setEditBioOpen}
                setEditPrefsOpen={setEditPrefsOpen}
                setEditVehicleOpen={setEditVehicleOpen}
              />
            ),
          },
          {
            key: "account",
            label: (
              <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                Account
              </span>
            ),
            children: (
              <AccountTabContent
                reputation={reputation}
                carbonSaved={carbonSaved}
                isDriverMode={isDriverMode}
                userTrips={userTrips}
                user={user}
                memberSince={memberSince}
                logout={logout}
                navigate={navigate}
              />
            ),
          },
        ]}
      />

      <PersonalDetailsModal
        open={editAboutOpen}
        onCancel={() => setEditAboutOpen(false)}
        form={aboutForm}
        onFinish={handleUpdateDetails}
      />
      <BioModal
        open={editBioOpen}
        onCancel={() => setEditBioOpen(false)}
        form={bioForm}
        onFinish={handleUpdateBio}
      />
      <PreferencesModal
        open={editPrefsOpen}
        onCancel={() => setEditPrefsOpen(false)}
        form={prefsForm}
        onFinish={handleUpdatePreferences}
      />
      <VehicleModal
        open={editVehicleOpen}
        onCancel={() => setEditVehicleOpen(false)}
        form={vehicleForm}
        onFinish={handleUpdateVehicle}
      />
    </div>
  );
}
