import { useState } from "react";
import dayjs from "dayjs";
import LocationInput from "./LocationInput";
import { routeAPI } from "../../api";
import useAuth from "../context/AuthContext/useAuth";
import { publishRide, findConflictingDates } from "../utils/publishRideActions";
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
  postedRides = [],
}) {
  const [form] = Form.useForm();
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);

  const { user } = useAuth();
  const departureTime = Form.useWatch("departureTime", form);

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

    const conflictingDates = findConflictingDates(values, postedRides);
    if (conflictingDates.length > 0) {
      Modal.error({
        title: "Ride Already Scheduled",
        content: `You already have a ride published at this exact date and time on: ${conflictingDates.join(", ")}. Please choose a different time or adjust your date range.`,
      });
      return;
    }

    setIsPublishing(true);
    try {
      await publishRide(values, user, sourceLocation, destinationLocation, {
        form,
        setSourceLocation,
        setDestinationLocation,
        onPublishSuccess,
      });
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
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
              disabledTime={(current) => {
                if (!current || !current.isSame(dayjs(), "day")) return {};
                const now = dayjs();
                return {
                  disabledHours: () =>
                    Array.from({ length: now.hour() }, (_, i) => i),
                  disabledMinutes: (selectedHour) =>
                    selectedHour === now.hour()
                      ? Array.from({ length: now.minute() + 1 }, (_, i) => i)
                      : [],
                };
              }}
              prefix={<CalendarOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="toDate" label="To Date">
            <DatePicker
              format="YYYY-MM-DD"
              placeholder="Leave blank for a single day"
              style={{ width: "100%" }}
              disabledDate={(current) =>
                departureTime &&
                current &&
                current < departureTime.startOf("day")
              }
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
