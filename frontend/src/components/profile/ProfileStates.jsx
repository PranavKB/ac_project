import { Card, Button, Typography } from "antd";

const { Title, Text, Paragraph } = Typography;

export function LoadingView() {
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

export function ErrorView({ error, onGoBack }) {
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
