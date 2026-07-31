import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu, Button } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  CarOutlined,
  FundOutlined,
  StarOutlined,
  FlagOutlined,
  BellOutlined,
  LogoutOutlined,
  CarFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import useAuth from "../../context/AuthContext/useAuth";

const { Sider, Content, Header } = Layout;

const MENU_ITEMS = [
  { key: "/admin", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/admin/users", icon: <TeamOutlined />, label: "Users" },
  { key: "/admin/rides", icon: <CarOutlined />, label: "Rides" },
  {
    key: "/admin/analytics/environmental",
    icon: <FundOutlined />,
    label: "Carbon Savings",
  },
  {
    key: "/admin/analytics/reputation",
    icon: <StarOutlined />,
    label: "Reputation",
  },
  { key: "/admin/reports", icon: <FlagOutlined />, label: "Reports" },
  {
    key: "/admin/notifications",
    icon: <BellOutlined />,
    label: "Notifications",
  },
  // { key: "/admin/settings", icon: <SettingOutlined />, label: "Settings" },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      logout();
      navigate("/login");
      return;
    }
    navigate(key);
  };

  const selectedKey =
    MENU_ITEMS.find((item) => location.pathname === item.key)?.key ||
    MENU_ITEMS.find(
      (item) => item.key !== "/admin" && location.pathname.startsWith(item.key),
    )?.key ||
    "/admin";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        trigger={null}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth={80}
        theme="light"
        style={{ borderRight: "1px solid #eef0f2" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: "16px",
            gap: "8px",
          }}
        >
          <CarFilled style={{ fontSize: "1.4rem", color: "#00aff5" }} />
          {!collapsed && (
            <span
              style={{ fontWeight: 800, color: "#054752", fontSize: "1.1rem" }}
            >
              Admin Panel
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          theme="light"
          selectedKeys={[selectedKey]}
          items={[
            ...MENU_ITEMS,
            { type: "divider" },
            {
              key: "logout",
              icon: <LogoutOutlined style={{ color: "#ff4d4f" }} />,
              label: <span style={{ color: "#ff4d4f" }}>Logout</span>,
            },
          ]}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #eef0f2",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: "1.1rem", color: "#054752" }}
          />
          <span style={{ fontWeight: 700, color: "#054752" }}>Admin</span>
        </Header>
        <Content style={{ margin: "24px", minHeight: "calc(100vh - 112px)" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
