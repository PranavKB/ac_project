import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../context/AuthContext/useAuth";
import { Layout, Button, Avatar, Dropdown, Space, Tooltip, Badge } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  StarFilled,
  CarFilled,
} from "@ant-design/icons";

const { Header } = Layout;

export default function Navbar() {
  const { user, activeRole, switchRole, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.data?.id) {
      refreshUser();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname.startsWith("/admin")
  ) {
    return null;
  }

  if (!user || !user.data) {
    return null;
  }

  const { name, totalCarbonSavedKg, reputationProfile } = user.data;
  const rating = reputationProfile?.trustScore || 80.0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleFindRide = () => {
    switchRole("PASSENGER");
    navigate("/passenger");
  };

  const handleOfferRide = () => {
    switchRole("DRIVER");
    navigate("/driver");
  };

  const isPassenger = activeRole === "PASSENGER" || !activeRole;

  const menuItems = [
    {
      key: "name-header",
      label: (
        <div
          style={{
            padding: "4px 12px",
            borderBottom: "1px solid #f0f0f0",
            pointerEvents: "none",
          }}
        >
          <strong>{name}</strong>
          <div style={{ fontSize: "0.8rem", color: "#8c8c8c" }}>
            {isPassenger ? "Passenger Mode" : "Driver Mode"}
          </div>
        </div>
      ),
    },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "My Profile",
      onClick: () => navigate("/profile"),
    },
    {
      key: "switch-role",
      icon: isPassenger ? <PlusOutlined /> : <SearchOutlined />,
      label: isPassenger ? "Switch to Driver" : "Switch to Passenger",
      onClick: isPassenger ? handleOfferRide : handleFindRide,
    },
    {
      key: "divider-1",
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined style={{ color: "#ff4d4f" }} />,
      label: <span style={{ color: "#ff4d4f" }}>Logout</span>,
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        background: "#ffffff",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #eef0f2",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        height: "64px",
      }}
    >
      {/* Left logo and branding */}
      <div
        style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
        onClick={handleFindRide}
      >
        <CarFilled
          style={{ fontSize: "1.5rem", color: "#00aff5", marginRight: 4 }}
        />
        <span
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "#00aff5",
            letterSpacing: "-0.5px",
          }}
        >
          CarPool
        </span>
      </div>

      {/* Right actions and profile */}
      <Space size="large" align="center">
        {isPassenger ? (
          <Button
            type="default"
            shape="round"
            icon={<PlusOutlined />}
            onClick={handleOfferRide}
            style={{
              borderColor: "#00aff5",
              color: "#00aff5",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            Offer a ride
          </Button>
        ) : (
          <Button
            type="default"
            shape="round"
            icon={<SearchOutlined />}
            onClick={handleFindRide}
            style={{
              borderColor: "#00aff5",
              color: "#00aff5",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            Find a ride
          </Button>
        )}

        {/* Flag Indicator */}
        <Tooltip title="India Region">
          <span
            style={{
              fontSize: "1.4rem",
              cursor: "default",
              userSelect: "none",
            }}
          >
            🇮🇳
          </span>
        </Tooltip>

        {/* CO2 and Rating Badges */}
        <Space size="small">
          <Tooltip title="Carbon Saved">
            <Badge
              count={`${totalCarbonSavedKg ? totalCarbonSavedKg.toFixed(1) : "0.0"} kg`}
              style={{ backgroundColor: "#52c41a", fontWeight: 600 }}
            />
          </Tooltip>
          <Tooltip title="Trust Score">
            <Badge
              count={
                <Space size={2} style={{ color: "#faad14", fontWeight: 600 }}>
                  <StarFilled style={{ fontSize: "0.75rem" }} />
                  {rating ? rating.toFixed(1) : "80.0"}
                </Space>
              }
              style={{
                backgroundColor: "#fffbe6",
                color: "#d48806",
                border: "1px solid #ffe58f",
                padding: "0 6px",
                height: "20px",
                lineHeight: "18px",
              }}
            />
          </Tooltip>
        </Space>

        {/* User avatar with dropdown */}
        <Dropdown
          menu={{ items: menuItems }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Avatar
            style={{
              backgroundColor: "#00aff5",
              cursor: "pointer",
              verticalAlign: "middle",
              fontWeight: 600,
            }}
            size="large"
            icon={<UserOutlined />}
          >
            {name ? name.charAt(0).toUpperCase() : "U"}
          </Avatar>
        </Dropdown>
      </Space>
    </Header>
  );
}
