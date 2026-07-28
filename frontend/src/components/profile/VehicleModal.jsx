import { Modal, Form, Input } from "antd";

export default function VehicleModal({ open, onCancel, form, onFinish }) {
  return (
    <Modal
      title={
        <span style={{ color: "#054752", fontWeight: 800 }}>
          Edit Vehicle Specifications
        </span>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="model"
          label="Vehicle Model"
          rules={[{ required: true, message: "Please enter model name" }]}
        >
          <Input placeholder="Toyota Innova" />
        </Form.Item>
        <Form.Item name="color" label="Color">
          <Input placeholder="Grey" />
        </Form.Item>
        <Form.Item name="plateNumber" label="Plate Number">
          <Input placeholder="KA-01-XX-XXXX" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
