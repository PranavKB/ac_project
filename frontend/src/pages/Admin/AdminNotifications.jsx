import { Card, Empty, Typography } from "antd";

const { Title } = Typography;

export default function AdminNotifications() {
  return (
    <div>
      <Title level={3} style={{ color: "#054752" }}>
        Notifications
      </Title>
      <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
        <Empty description="Notifications are coming soon." />
      </Card>
    </div>
  );
}
