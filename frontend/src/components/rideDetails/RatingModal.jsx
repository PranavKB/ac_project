import { Modal, Form, Rate, Input, Typography, Button, Space } from "antd";

const { Text } = Typography;

const RATING_METRIC_GROUPS = [
  {
    title: "Trust",
    color: "#52c41a",
    fields: [
      { name: "punctualityFactor", label: "Punctuality" },
      {
        name: "cancellationConsistency",
        label: "No last-minute cancellations",
      },
      { name: "safeDrivingAssessment", label: "Safety & behavior" },
    ],
  },
  {
    title: "Reliability",
    color: "#00aff5",
    fields: [
      { name: "rideCompletionSuccess", label: "Trip completed as expected" },
      { name: "uniformRoutineConsistency", label: "Consistency" },
    ],
  },
  {
    title: "Comfort",
    color: "#faad14",
    fields: [
      { name: "vehicleCleanlinessMetric", label: "Cleanliness / comfort" },
      { name: "communicationQualityFeedback", label: "Communication" },
    ],
  },
];

const RATING_INITIAL_VALUES = RATING_METRIC_GROUPS.flatMap(
  (g) => g.fields,
).reduce((acc, field) => ({ ...acc, [field.name]: 5 }), {});

export default function RatingModal({
  target,
  onCancel,
  onSubmit,
  submitting,
}) {
  const [form] = Form.useForm();

  if (!target) return null;

  return (
    <Modal
      open={!!target}
      title={`Rate ${target.name}`}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={RATING_INITIAL_VALUES}
        onFinish={(values) => onSubmit(values, form)}
      >
        {RATING_METRIC_GROUPS.map((group) => (
          <div key={group.title} style={{ marginBottom: "12px" }}>
            <Text strong style={{ color: group.color }}>
              {group.title}
            </Text>
            {group.fields.map((field) => (
              <Form.Item
                key={field.name}
                name={field.name}
                label={field.label}
                style={{ marginBottom: "8px", marginTop: "6px" }}
              >
                <Rate />
              </Form.Item>
            ))}
          </div>
        ))}
        <Form.Item name="textReview" label="Comments (optional)">
          <Input.TextArea
            rows={3}
            placeholder="Share more about your experience..."
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Submit Rating
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
