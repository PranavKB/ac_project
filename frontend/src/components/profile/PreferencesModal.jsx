import { Modal, Form, Select } from "antd";

export default function PreferencesModal({ open, onCancel, form, onFinish }) {
  return (
    <Modal
      title={
        <span style={{ color: "#054752", fontWeight: 800 }}>
          Edit Travel Preferences
        </span>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="chattiness" label="Chattiness">
          <Select
            options={[
              { value: "Quiet", label: "Quiet" },
              { value: "Talkative", label: "Talkative" },
              { value: "Normal", label: "Normal" },
            ]}
          />
        </Form.Item>
        <Form.Item name="music" label="Music preference">
          <Select
            options={[
              { value: "No Music", label: "No Music" },
              { value: "Pop/Rock", label: "Pop/Rock" },
              { value: "Any music", label: "Any music" },
            ]}
          />
        </Form.Item>
        <Form.Item name="smoking" label="Smoking preference">
          <Select
            options={[
              { value: "No Smoking", label: "No Smoking" },
              { value: "Smoking allowed", label: "Smoking allowed" },
            ]}
          />
        </Form.Item>
        <Form.Item name="pets" label="Pets preference">
          <Select
            options={[
              { value: "No Pets", label: "No Pets" },
              { value: "Pets allowed", label: "Pets allowed" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
