import { Card, Space } from "antd";
import { CheckCircleOutlined, MailOutlined } from "@ant-design/icons";

export default function VerificationListCard({ email }) {
  return (
    <Card
      title={
        <span style={{ color: "#054752", fontWeight: 700 }}>
          Verify your profile
        </span>
      }
      style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Space>
          <MailOutlined style={{ color: "#708c91" }} />
          <span>Email Verified{email ? `: ${email}` : ""}</span>
        </Space>
        <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1.2rem" }} />
      </div>
    </Card>
  );
}
