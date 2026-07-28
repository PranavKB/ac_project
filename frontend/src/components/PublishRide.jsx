import { useState } from "react";
import LocationInput from "./LocationInput";
import { rideAPI, routeAPI } from "../../api";
import useAuth from "../context/AuthContext/useAuth";
import {
  Card,
  Form,
  InputNumber,
  DatePicker,
  Button,
  Space,
  Modal,
  Row,
  Col,
} from "antd";
import {
  CarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";

export default function PublishRide({
  onPublishSuccess,
  onMapUpdate,
  isEmbed = false,
}) {
  const [form] = Form.useForm();
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);

  const { user } = useAuth();

  const handlePreview = async () => {
    if (!sourceLocation || !destinationLocation) {
      Modal.warning({
        title: "Missing Locations",
        content: "Please select both origin and destination locations first.",
      });
      return;
    }
    setIsPreviewing(true);
    try {
      const routeCoords = await routeAPI.fetch(
        sourceLocation,
        destinationLocation,
      );
      if (onMapUpdate) {
        onMapUpdate({
          source: [sourceLocation.lat, sourceLocation.lng],
          destination: [destinationLocation.lat, destinationLocation.lng],
          routeCoords,
        });
      }
    } catch (err) {
      console.error("Route preview failed:", err);
    } finally {
      setIsPreviewing(false);
    }
  };

  const onFinish = async (values) => {
    if (!sourceLocation || !destinationLocation) {
      Modal.error({
        title: "Validation Error",
        content: "Please select valid origin and destination locations.",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const durationMins = parseInt(values.estimatedDurationMinutes, 10) || 0;
      const departureISO = values.departureTime.toISOString();

      const requestBody = {
        driverId: user.data.id,
        driverName: user.data.name,
        totalSeats: parseInt(values.totalSeats, 10) || 1,
        departureTime: departureISO,
        estimatedDurationMinutes: durationMins,
        pricePerSeat: values.pricePerSeat
          ? parseFloat(values.pricePerSeat)
          : null,
        source: {
          name: sourceLocation.name,
          location: {
            type: "Point",
            // GeoJSON order: [longitude, latitude]
            coordinates: [
              parseFloat(sourceLocation.lng),
              parseFloat(sourceLocation.lat),
            ],
          },
        },
        destination: {
          name: destinationLocation.name,
          location: {
            type: "Point",
            // GeoJSON order: [longitude, latitude]
            coordinates: [
              parseFloat(destinationLocation.lng),
              parseFloat(destinationLocation.lat),
            ],
          },
        },
      };

      const response = await rideAPI.create(requestBody);
      const newRide = response?.data || response;

      Modal.success({
        title: "Ride Published!",
        content:
          "Your ride was created successfully and is now active for passenger matching.",
      });

      form.resetFields();
      setSourceLocation(null);
      setDestinationLocation(null);

      if (onPublishSuccess) {
        await onPublishSuccess(newRide);
      }
    } catch (error) {
      console.error("Error publishing ride:", error);
      Modal.error({
        title: "Failed to Publish",
        content: "There was an error publishing your ride. Please try again.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const formContent = (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ totalSeats: 4 }}
      onFinish={onFinish}
    >
      <Form.Item label="Origin Address" required>
        <LocationInput
          placeholder="Enter origin location..."
          onSelect={setSourceLocation}
        />
      </Form.Item>

      <Form.Item label="Destination Address" required>
        <LocationInput
          placeholder="Enter destination location..."
          onSelect={setDestinationLocation}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={10}>
          <Form.Item
            name="totalSeats"
            label="Seats Available"
            rules={[{ required: true, message: "Please enter total seats" }]}
          >
            <InputNumber
              min={1}
              max={8}
              style={{ width: "100%" }}
              prefix={<CarOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={14}>
          <Form.Item
            name="departureTime"
            label="Departure Date & Time"
            rules={[
              { required: true, message: "Please select departure time" },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder="Select date & time"
              style={{ width: "100%" }}
              prefix={<CalendarOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="estimatedDurationMinutes"
            label="Estimated Duration (minutes)"
            rules={[
              { required: true, message: "Please enter estimated duration" },
            ]}
          >
            <InputNumber
              min={1}
              max={1440}
              style={{ width: "100%" }}
              placeholder="e.g. 90"
              prefix={<ClockCircleOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="pricePerSeat"
            label="Price per Seat (₹)"
            rules={[{ required: true, message: "Please enter price per seat" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="e.g. 500"
              prefix={<DollarOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item style={{ marginTop: "16px", marginBottom: 0 }}>
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button
            type="default"
            onClick={handlePreview}
            loading={isPreviewing}
            disabled={!sourceLocation || !destinationLocation}
          >
            Preview Route
          </Button>
          <Button type="primary" htmlType="submit" loading={isPublishing}>
            Publish Trip
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  if (isEmbed) {
    return formContent;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 24px" }}>
      <Card
        title={
          <span style={{ color: "#054752", fontWeight: 800 }}>
            Publish a Ride
          </span>
        }
        style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}
      >
        {formContent}
      </Card>
    </div>
  );
}
