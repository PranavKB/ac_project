import { Modal, Form, Input } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";

export default function PersonalDetailsModal({
  open,
  onCancel,
  form,
  onFinish,
}) {
  return (
    <Modal
      title={
        <span style={{ color: "#054752", fontWeight: 800 }}>
          Edit Personal Details
        </span>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="name"
          label="Full Name"
          rules={[{ required: true, message: "Please enter your name" }]}
        >
          <Input prefix={<UserOutlined />} />
        </Form.Item>
        <Form.Item name="email" label="Email Address">
          <Input disabled prefix={<MailOutlined />} />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Phone Number"
          rules={[{ required: true, message: "Please enter phone number" }]}
        >
          <Input prefix={<PhoneOutlined />} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
