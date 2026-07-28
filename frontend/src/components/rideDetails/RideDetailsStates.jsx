import { Card, Button, Typography } from "antd";

const { Title, Text, Paragraph } = Typography;

export function RideDetailsLoadingView() {
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
        Loading ride details...
      </Text>
    </div>
  );
}

export function RideDetailsErrorView({ error, onGoBack }) {
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
        <Title level={3}>Ride Not Found</Title>
        <Paragraph type="secondary">
          {error || "The requested ride does not exist."}
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
