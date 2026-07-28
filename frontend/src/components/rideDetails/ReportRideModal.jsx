import { Modal, Form, Select, Input, Button, Space } from "antd";

const REPORT_REASONS = [
  "Unsafe driving",
  "No-show",
  "Inappropriate behavior",
  "Vehicle mismatch",
  "Other",
];

export default function ReportRideModal({
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
      title="Report this ride"
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => onSubmit(values, form)}
      >
        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: "Please select a reason" }]}
        >
          <Select
            placeholder="Select a reason"
            options={REPORT_REASONS.map((reason) => ({
              value: reason,
              label: reason,
            }))}
          />
        </Form.Item>
        <Form.Item name="details" label="Additional details (optional)">
          <Input.TextArea rows={4} placeholder="Describe what happened..." />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              type="primary"
              danger
              htmlType="submit"
              loading={submitting}
            >
              Submit Report
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
