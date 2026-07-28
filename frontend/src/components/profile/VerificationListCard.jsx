import { Card, Space, Checkbox } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

export default function VerificationListCard({
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
