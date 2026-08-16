import { Modal, Form, Input } from "antd";

export default function BioModal({ open, onCancel, form, onFinish }) {
  return (
    <Modal
      title={
        <span style={{ color: "#054752", fontWeight: 800 }}>Edit Bio</span>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="bio"
          label="Mini Bio"
          rules={[{ required: true, message: "Please write a short bio" }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Tell passengers about yourself..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
