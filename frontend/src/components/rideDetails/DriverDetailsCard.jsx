import { Card, Avatar, Space, Typography, Button, Tag, Modal } from "antd";
import {
  StarFilled,
  MessageOutlined,
  CarOutlined,
  RightOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function DriverDetailsCard({
  driverInitial,
  driverName,
  driverRating,
  driverVehicle,
  driverSmokingPreference,
  showRateButton,
  alreadyRatedDriver,
  onRateDriver,
}) {
  const vehicleLine = driverVehicle?.model
    ? `${driverVehicle.model}${driverVehicle.color ? ` - ${driverVehicle.color}` : ""}`
    : "Vehicle details not specified";
  const smokingLine =
    driverSmokingPreference || "Smoking preference not specified";
  return (
    <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f6f7f9",
          paddingBottom: "16px",
          marginBottom: "16px",
        }}
      >
        <Space size="middle">
          <Avatar
            size={48}
            style={{
              backgroundColor: "#e6f7ff",
              color: "#00aff5",
              fontWeight: 600,
            }}
          >
            {driverInitial}
          </Avatar>
          <div>
            <Title
              level={4}
              style={{ margin: 0, fontSize: "1.1rem", color: "#054752" }}
            >
              {driverName}
            </Title>
            <Space size={4} style={{ color: "#faad14", fontSize: "0.85rem" }}>
              <StarFilled />
              <span style={{ fontWeight: 600 }}>
                {driverRating ? `${driverRating} / 5` : "New driver"}
              </span>
            </Space>
          </div>
        </Space>
        <RightOutlined style={{ color: "#708c91" }} />
      </div>
      <Space
        orientation="vertical"
        size="middle"
        style={{
          width: "100%",
          fontSize: "0.95rem",
          color: "#054752",
          marginBottom: "20px",
        }}
      >
        <div>{smokingLine}</div>
        <div>
          <CarOutlined style={{ color: "#708c91", marginRight: "8px" }} />{" "}
          {vehicleLine}
          {driverVehicle?.plateNumber && ` (${driverVehicle.plateNumber})`}
        </div>
      </Space>
      <Space wrap>
        <Button
          type="default"
          shape="round"
          icon={<MessageOutlined />}
          onClick={() =>
            Modal.info({
              title: "Contact",
              content: `Contacting ${driverName}...`,
            })
          }
          style={{ borderColor: "#00aff5", color: "#00aff5", fontWeight: 700 }}
        >
          Contact {driverName}
        </Button>
        {showRateButton &&
          (alreadyRatedDriver ? (
            <Tag
              color="blue"
              style={{ padding: "4px 12px", borderRadius: "999px" }}
            >
              ✓ You rated this driver
            </Tag>
          ) : (
            <Button
              type="primary"
              ghost
              shape="round"
              icon={<StarFilled />}
              onClick={onRateDriver}
              style={{ fontWeight: 700 }}
            >
              Rate {driverName}
            </Button>
          ))}
      </Space>
    </Card>
  );
}
