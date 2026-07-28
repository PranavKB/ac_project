import { Card, Row, Col, Typography } from "antd";
import MapComponent from "../MapComponent";
import PublishRide from "../PublishRide";

const { Title } = Typography;

export default function OfferARide({
  onPublishSuccess,
  onMapUpdate,
  mapProps,
}) {
  return (
    <Row gutter={[32, 32]}>
      <Col xs={24} md={11}>
        <Card
          title={
            <Title
              level={3}
              style={{ margin: 0, color: "#054752", fontWeight: 800 }}
            >
              Offer a Ride
            </Title>
          }
          style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
        >
          <PublishRide
            isEmbed={true}
            onPublishSuccess={onPublishSuccess}
            onMapUpdate={onMapUpdate}
          />
        </Card>
      </Col>
      <Col xs={24} md={13}>
        <Card
          style={{
            borderRadius: "16px",
            border: "1px solid #eef0f2",
            overflow: "hidden",
            height: "100%",
            minHeight: "500px",
          }}
          styles={{ body: { padding: 0, height: "100%" } }}
        >
          <div style={{ width: "100%", height: "550px", position: "relative" }}>
            <MapComponent
              source={mapProps.source}
              destination={mapProps.destination}
              routeCoords={mapProps.routeCoords}
            />
          </div>
        </Card>
      </Col>
    </Row>
  );
}
