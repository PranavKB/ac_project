import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/AuthContext/useAuth";
import { userAPI, rideAPI, requestAPI } from "../../api";
import {
  Card,
  Tabs,
  Progress,
  Avatar,
  Button,
  Modal,
  Form,
  Checkbox,
  Select,
  Row,
  Col,
  Tag,
  Typography,
  Space,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CarOutlined,
  SmileOutlined,
  SoundOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

// --- Helper Modals and Sub-components to satisfy max-lines-per-function rule ---

function PersonalDetailsModal({ open, onCancel, form, onFinish }) {
  return (
    <Modal
      title={
        <span style={{ color: "#054752", fontWeight: 800 }}>
          Edit Personal Details
        </span>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="name"
          label="Full Name"
          rules={[{ required: true, message: "Please enter your name" }]}
        >
          <Input prefix={<UserOutlined />} />
        </Form.Item>
        <Form.Item name="email" label="Email Address">
          <Input disabled prefix={<MailOutlined />} />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Phone Number"
          rules={[{ required: true, message: "Please enter phone number" }]}
        >
          <Input prefix={<PhoneOutlined />} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function BioModal({ open, onCancel, form, onFinish }) {
  return (
    <Modal
      title={
        <span style={{ color: "#054752", fontWeight: 800 }}>Edit Bio</span>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="bio"
          label="Mini Bio"
          rules={[{ required: true, message: "Please write a short bio" }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Tell passengers about yourself..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function PreferencesModal({ open, onCancel, form, onFinish }) {
  return (
    <Modal
      title={
        <span style={{ color: "#054752", fontWeight: 800 }}>
          Edit Travel Preferences
        </span>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="chattiness" label="Chattiness">
          <Select
            options={[
              { value: "Quiet", label: "Quiet" },
              { value: "Talkative", label: "Talkative" },
              { value: "Normal", label: "Normal" },
            ]}
          />
        </Form.Item>
        <Form.Item name="music" label="Music preference">
          <Select
            options={[
              { value: "No Music", label: "No Music" },
              { value: "Pop/Rock", label: "Pop/Rock" },
              { value: "Any music", label: "Any music" },
            ]}
          />
        </Form.Item>
        <Form.Item name="smoking" label="Smoking preference">
          <Select
            options={[
              { value: "No Smoking", label: "No Smoking" },
              { value: "Smoking allowed", label: "Smoking allowed" },
            ]}
          />
        </Form.Item>
        <Form.Item name="pets" label="Pets preference">
          <Select
            options={[
              { value: "No Pets", label: "No Pets" },
              { value: "Pets allowed", label: "Pets allowed" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function VehicleModal({ open, onCancel, form, onFinish }) {
  return (
    <Modal
      title={
        <span style={{ color: "#054752", fontWeight: 800 }}>
          Edit Vehicle Specifications
        </span>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="model"
          label="Vehicle Model"
          rules={[{ required: true, message: "Please enter model name" }]}
        >
          <Input placeholder="Toyota Innova" />
        </Form.Item>
        <Form.Item name="color" label="Color">
          <Input placeholder="Grey" />
        </Form.Item>
        <Form.Item name="plateNumber" label="Plate Number">
          <Input placeholder="KA-01-XX-XXXX" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function ProfileHeaderCard({
  avatarInitial,
  name,
  email,
  profileCompletion,
  setEditAboutOpen,
}) {
  return (
    <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space size="large">
          <Avatar
            size={70}
            style={{
              backgroundColor: "#00aff5",
              fontWeight: 600,
              fontSize: "2rem",
            }}
            icon={<UserOutlined />}
          >
            {avatarInitial}
          </Avatar>
          <div>
            <Title
              level={3}
              style={{ margin: "0 0 4px", color: "#054752", fontWeight: 800 }}
            >
              {name}
            </Title>
            <Text type="secondary">{email}</Text>
          </div>
        </Space>
        <Button
          type="default"
          shape="round"
          icon={<EditOutlined />}
          onClick={() => setEditAboutOpen(true)}
        >
          Edit Details
        </Button>
      </div>
      <div style={{ marginTop: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <Text type="secondary">Profile Completeness</Text>
          <Text strong>{profileCompletion}%</Text>
        </div>
        <Progress
          percent={profileCompletion}
          strokeColor="#00aff5"
          showInfo={false}
        />
      </div>
    </Card>
  );
}

function VerificationListCard({
  govtIdVerified,
  setGovtIdVerified,
  emailVerified,
  setEmailVerified,
  phoneVerified,
  setPhoneVerified,
}) {
  return (
    <Card
      title={
        <span style={{ color: "#054752", fontWeight: 700 }}>
          Verify your profile
        </span>
      }
      style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Checkbox
            checked={govtIdVerified}
            onChange={(e) => setGovtIdVerified(e.target.checked)}
          >
            Verified Government ID
          </Checkbox>
          {govtIdVerified && (
            <CheckCircleOutlined
              style={{ color: "#52c41a", fontSize: "1.2rem" }}
            />
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Checkbox
            checked={emailVerified}
            onChange={(e) => setEmailVerified(e.target.checked)}
          >
            Verify Email Address
          </Checkbox>
          {emailVerified && (
            <CheckCircleOutlined
              style={{ color: "#52c41a", fontSize: "1.2rem" }}
            />
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Checkbox
            checked={phoneVerified}
            onChange={(e) => setPhoneVerified(e.target.checked)}
          >
            Verify Phone Number
          </Checkbox>
          {phoneVerified && (
            <CheckCircleOutlined
              style={{ color: "#52c41a", fontSize: "1.2rem" }}
            />
          )}
        </div>
      </Space>
    </Card>
  );
}

function AboutTabContent({
  user,
  avatarInitial,
  profileCompletion,
  govtIdVerified,
  setGovtIdVerified,
  emailVerified,
  setEmailVerified,
  phoneVerified,
  setPhoneVerified,
  bio,
  preferences,
  vehicle,
  isDriverMode,
  setEditAboutOpen,
  setEditBioOpen,
  setEditPrefsOpen,
  setEditVehicleOpen,
}) {
  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <ProfileHeaderCard
        avatarInitial={avatarInitial}
        name={user?.data?.name}
        email={user?.data?.email}
        profileCompletion={profileCompletion}
        setEditAboutOpen={setEditAboutOpen}
      />

      <VerificationListCard
        govtIdVerified={govtIdVerified}
        setGovtIdVerified={setGovtIdVerified}
        emailVerified={emailVerified}
        setEmailVerified={setEmailVerified}
        phoneVerified={phoneVerified}
        setPhoneVerified={setPhoneVerified}
      />

      <Card
        title={
          <span style={{ color: "#054752", fontWeight: 700 }}>About you</span>
        }
        style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
      >
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <Text strong style={{ color: "#054752" }}>
                Mini Bio
              </Text>
              <Button
                type="link"
                onClick={() => setEditBioOpen(true)}
                style={{ padding: 0 }}
              >
                Edit
              </Button>
            </div>
            <Paragraph
              type="secondary"
              style={{ margin: 0, fontSize: "0.95rem" }}
            >
              {bio ||
                "Add a mini bio to help passengers get to know you better."}
            </Paragraph>
          </div>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <Text strong style={{ color: "#054752" }}>
                Preferences
              </Text>
              <Button
                type="link"
                onClick={() => setEditPrefsOpen(true)}
                style={{ padding: 0 }}
              >
                Edit
              </Button>
            </div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Space>
                  <SmileOutlined />
                  <Text type="secondary">
                    Chattiness: {preferences?.chattiness || "Not specified"}
                  </Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space>
                  <SoundOutlined />
                  <Text type="secondary">
                    Music: {preferences?.music || "Not specified"}
                  </Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space>
                  <InfoCircleOutlined />
                  <Text type="secondary">
                    Smoking: {preferences?.smoking || "Not specified"}
                  </Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space>
                  <SmileOutlined />
                  <Text type="secondary">
                    Pets: {preferences?.pets || "Not specified"}
                  </Text>
                </Space>
              </Col>
            </Row>
          </div>
        </Space>
      </Card>

      {isDriverMode && (
        <Card
          title={
            <span style={{ color: "#054752", fontWeight: 700 }}>
              Driver Profile & Vehicle
            </span>
          }
          style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <Space>
              <CarOutlined />
              <Text strong style={{ color: "#054752" }}>
                Vehicle Specifications
              </Text>
            </Space>
            <Button
              type="link"
              onClick={() => setEditVehicleOpen(true)}
              style={{ padding: 0 }}
            >
              Edit
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text type="secondary">Model:</Text>{" "}
              <Text strong>{vehicle?.model || "Not specified"}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Color:</Text>{" "}
              <Text strong>{vehicle?.color || "Not specified"}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Plate Number:</Text>{" "}
              <Text strong>{vehicle?.plateNumber || "Not specified"}</Text>
            </Col>
          </Row>
        </Card>
      )}
    </Space>
  );
}

function AccountTabContent({
  reputation,
  carbonSaved,
  isDriverMode,
  userTrips,
  user,
  memberSince,
  logout,
  navigate,
}) {
  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <Card
        title={
          <span style={{ color: "#054752", fontWeight: 700 }}>
            Reputation Metrics
          </span>
        }
        style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
      >
        <Row
          gutter={[24, 24]}
          justify="center"
          style={{ textAlign: "center", marginBottom: "20px" }}
        >
          <Col span={8}>
            <Progress
              type="circle"
              percent={reputation?.trustScore || 80}
              size={70}
              strokeColor="#52c41a"
            />
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#708c91",
                marginTop: "8px",
                textTransform: "uppercase",
              }}
            >
              Trust
            </div>
          </Col>
          <Col span={8}>
            <Progress
              type="circle"
              percent={reputation?.reliabilityScore || 90}
              size={70}
              strokeColor="#00aff5"
            />
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#708c91",
                marginTop: "8px",
                textTransform: "uppercase",
              }}
            >
              Reliability
            </div>
          </Col>
          <Col span={8}>
            <Progress
              type="circle"
              percent={reputation?.comfortScore || 80}
              size={70}
              strokeColor="#faad14"
            />
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#708c91",
                marginTop: "8px",
                textTransform: "uppercase",
              }}
            >
              Comfort
            </div>
          </Col>
        </Row>
        <Card
          style={{
            background: "rgba(0,175,245,0.02)",
            border: "none",
            borderRadius: "12px",
          }}
        >
          <Text strong style={{ display: "block", marginBottom: "4px" }}>
            AI Member Summary:
          </Text>
          <Text type="secondary" style={{ fontSize: "0.9rem" }}>
            {reputation?.aiSummary ||
              "Member has verified contacts and completed onboarding."}
          </Text>
        </Card>
      </Card>

      <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Avatar
            size={48}
            style={{
              backgroundColor: "#f6ffed",
              color: "#52c41a",
              fontSize: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🌱
          </Avatar>
          <div>
            <Title level={4} style={{ margin: 0, color: "#054752" }}>
              {carbonSaved ? carbonSaved.toFixed(1) : "0.0"} kg CO₂ saved
            </Title>
            <Text type="secondary" style={{ fontSize: "0.85rem" }}>
              Total environmental offset credited to your account.
            </Text>
          </div>
        </div>
      </Card>

      <Card
        title={
          <span style={{ color: "#054752", fontWeight: 700 }}>
            {isDriverMode ? "Posted Rides History" : "Booked Trips History"}
          </span>
        }
        style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
      >
        {userTrips.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {userTrips.map((trip) => {
              const displayStatus = isDriverMode
                ? trip.status
                : trip.status === "APPROVED" && trip.rideStatus === "ONGOING"
                  ? "ONGOING"
                  : trip.status === "APPROVED" &&
                      trip.rideStatus === "COMPLETED"
                    ? "COMPLETED"
                    : trip.status;

              const tagColors = {
                ONGOING: "processing",
                COMPLETED: "default",
                APPROVED: "success",
                PENDING: "warning",
              };
              const sourceLabel = trip.source?.name
                ? trip.source.name.split(",")[0]
                : "Origin";
              const destLabel = trip.destination?.name
                ? trip.destination.name.split(",")[0]
                : "Destination";
              const targetId = isDriverMode ? trip.id : trip.rideId;

              return (
                <div
                  key={trip.id || targetId}
                  onClick={() => targetId && navigate(`/rides/${targetId}`)}
                  style={{
                    cursor: "pointer",
                    padding: "16px 0",
                    borderBottom: "1px solid #f6f7f9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#054752",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        marginBottom: "4px",
                      }}
                    >
                      {sourceLabel} {" -> "} {destLabel}
                    </div>
                    <Text type="secondary" style={{ fontSize: "0.85rem" }}>
                      Price per seat: ₹{trip.pricePerSeat || "1,130"}
                    </Text>
                  </div>
                  <Tag color={tagColors[displayStatus] || "blue"}>
                    {displayStatus}
                  </Tag>
                </div>
              );
            })}
          </div>
        ) : (
          <Text type="secondary">
            {isDriverMode
              ? "You haven't posted any rides yet."
              : "You haven't requested any rides yet."}
          </Text>
        )}
      </Card>

      <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <Text type="secondary">Registered Roles</Text>
          <Text
            strong
            style={{ color: "#054752", textTransform: "capitalize" }}
          >
            {user?.data?.roles ? user.data.roles.join(", ") : "User"}
          </Text>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <Text type="secondary">Member Since</Text>
          <Text strong style={{ color: "#054752" }}>
            {memberSince || "July 2026"}
          </Text>
        </div>
        <Button
          danger
          block
          size="large"
          icon={<LogoutOutlined />}
          onClick={logout}
          style={{ borderRadius: "12px", fontWeight: 600 }}
        >
          Log Out
        </Button>
      </Card>
    </Space>
  );
}

function LoadingView() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <Text type="secondary" style={{ fontSize: "1.2rem" }}>
        Loading profile details...
      </Text>
    </div>
  );
}

function ErrorView({ error, onGoBack }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        padding: "0 24px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "450px",
          borderRadius: "16px",
          textAlign: "center",
        }}
      >
        <Title level={3}>Profile Not Found</Title>
        <Paragraph type="secondary">
          {error || "User data is missing."}
        </Paragraph>
        <Button
          type="primary"
          size="large"
          block
          onClick={onGoBack}
          style={{ borderRadius: "12px", marginTop: "12px", fontWeight: 600 }}
        >
          Go Back
        </Button>
      </Card>
    </div>
  );
}

const updateUserProfile = async (userId, updatePayload, options) => {
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

// --- Main component ---

export default function Profile() {
  const { user, activeRole, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for verification options
  const [govtIdVerified, setGovtIdVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Profile data states
  const [bio, setBio] = useState("");
  const [preferences, setPreferences] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [reputation, setReputation] = useState(null);
  const [userTrips, setUserTrips] = useState([]);

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
      setGovtIdVerified(!!data.isGovtIdVerified);
      setEmailVerified(!!data.isEmailVerified);
      setPhoneVerified(!!data.isPhoneVerified);
      setPreferences(data.preferences || {});
      setVehicle(data.vehicleDetails || {});
      setReputation(data.reputationProfile || {});

      aboutForm.setFieldsValue({
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
      bioForm.setFieldsValue({ bio: data.bio });
      prefsForm.setFieldsValue(data.preferences || {});
      vehicleForm.setFieldsValue(data.vehicleDetails || {});

      if (isDriverMode) {
        const rides = await rideAPI.getByDriver(user.data.id);
        setUserTrips(rides?.data || rides || []);
      } else {
        const reqs = await requestAPI.getByPassenger(user.data.id);
        setUserTrips(reqs?.data || reqs || []);
      }
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
      govtIdVerified,
      emailVerified,
      phoneVerified,
      successMsg: "Personal details updated successfully!",
      setOpen: setEditAboutOpen,
      callback: fetchProfileData,
    });

  const handleUpdateBio = (values) =>
    updateUserProfile(
      user.data.id,
      { bio: values.bio },
      {
        govtIdVerified,
        emailVerified,
        phoneVerified,
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
        govtIdVerified,
        emailVerified,
        phoneVerified,
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
        govtIdVerified,
        emailVerified,
        phoneVerified,
        successMsg: "Vehicle details updated successfully!",
        setOpen: setEditVehicleOpen,
        callback: fetchProfileData,
      },
    );

  if (loading || !user) return <LoadingView />;
  if (error) return <ErrorView error={error} onGoBack={() => navigate(-1)} />;

  const carbonSaved = user.data.totalCarbonSavedKg || 0;
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
  if (govtIdVerified || emailVerified || phoneVerified) completionItems += 25;
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
                govtIdVerified={govtIdVerified}
                setGovtIdVerified={setGovtIdVerified}
                emailVerified={emailVerified}
                setEmailVerified={setEmailVerified}
                phoneVerified={phoneVerified}
                setPhoneVerified={setPhoneVerified}
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
