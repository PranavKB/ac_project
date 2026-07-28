import { Card, Space, Row, Col, Typography, Button } from "antd";
import {
  CarOutlined,
  SmileOutlined,
  SoundOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import ProfileHeaderCard from "./ProfileHeaderCard";
import VerificationListCard from "./VerificationListCard";

const { Text, Paragraph } = Typography;

function BioAndPreferencesCard({
  bio,
  preferences,
  setEditBioOpen,
  setEditPrefsOpen,
}) {
  return (
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
            {bio || "Add a mini bio to help passengers get to know you better."}
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
  );
}

function VehicleDetailsCard({ vehicle, setEditVehicleOpen }) {
  return (
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
  );
}

export default function AboutTabContent({
  user,
  avatarInitial,
  profileCompletion,
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

      <VerificationListCard email={user?.data?.email} />

      <BioAndPreferencesCard
        bio={bio}
        preferences={preferences}
        setEditBioOpen={setEditBioOpen}
        setEditPrefsOpen={setEditPrefsOpen}
      />

      {isDriverMode && (
        <VehicleDetailsCard
          vehicle={vehicle}
          setEditVehicleOpen={setEditVehicleOpen}
        />
      )}
    </Space>
  );
}
