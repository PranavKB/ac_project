import { Card, Empty, Typography } from "antd";

const { Title } = Typography;

export default function AdminSettings() {
  return (
    <div>
      <Title level={3} style={{ color: "#054752" }}>
        Settings
      </Title>
      <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
        <Empty description="Admin settings are coming soon." />
      </Card>
    </div>
  );
}
