import { Card, Avatar, Space, Typography, Button, Progress } from "antd";
import { EditOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function ProfileHeaderCard({
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
