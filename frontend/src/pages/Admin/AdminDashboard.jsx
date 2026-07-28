import { useEffect, useState } from "react";
import { adminAPI } from "../../../api";
import "./AdminDashboard.scss";

const TABS = ["Overview", "Users", "Rides"];

export default function AdminDashboard() {
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tab === "Overview") fetchStats();
    else if (tab === "Users") fetchUsers();
    else if (tab === "Rides") fetchRides();
  }, [tab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch {
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchRides = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getRides();
      setRides(res.data);
    } catch {
      setError("Failed to load rides");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    await adminAPI.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleBanToggle = async (user) => {
    const isBanned = user.roles?.includes("BANNED");
    const res = isBanned
      ? await adminAPI.unbanUser(user.id)
      : await adminAPI.banUser(user.id);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
  };

  const handleDeleteRide = async (id) => {
    if (!confirm("Delete this ride?")) return;
    await adminAPI.deleteRide(id);
    setRides((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? "active" : ""}`}
            onClick={() => { setError(""); setTab(t); }}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-loading">Loading...</p>}

      {!loading && tab === "Overview" && stats && (
        <div className="admin-stats">
          {[
            { label: "Total Users", value: stats.totalUsers, color: "blue" },
            { label: "Total Rides", value: stats.totalRides, color: "green" },
            { label: "Active Rides", value: stats.activeRides, color: "amber" },
            { label: "Ongoing Rides", value: stats.ongoingRides, color: "purple" },
            { label: "Completed Rides", value: stats.completedRides, color: "teal" },
            { label: "Total Requests", value: stats.totalRequests, color: "red" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`stat-card stat-card--${color}`}>
              <span className="stat-value">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "Users" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Roles</th>
                <th>Trust Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isBanned = u.roles?.includes("BANNED");
                return (
                  <tr key={u.id} className={isBanned ? "row-banned" : ""}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>
                      {u.roles?.map((r) => (
                        <span key={r} className={`badge badge--${r.toLowerCase()}`}>{r}</span>
                      ))}
                    </td>
                    <td>{u.reputationProfile?.trustScore?.toFixed(1) ?? "—"}</td>
                    <td className="action-cell">
                      <button
                        className={`btn-sm ${isBanned ? "btn-unban" : "btn-ban"}`}
                        onClick={() => handleBanToggle(u)}
                      >
                        {isBanned ? "Unban" : "Ban"}
                      </button>
                      <button
                        className="btn-sm btn-delete"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && <p className="empty-msg">No users found.</p>}
        </div>
      )}

      {!loading && tab === "Rides" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>From</th>
                <th>To</th>
                <th>Departure</th>
                <th>Seats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.id}>
                  <td>{r.driverName}</td>
                  <td>{r.source?.name}</td>
                  <td>{r.destination?.name}</td>
                  <td>{r.departureTime ? new Date(r.departureTime).toLocaleString() : "—"}</td>
                  <td>{r.availableSeats}/{r.totalSeats}</td>
                  <td>
                    <span className={`badge badge--${r.status?.toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td className="action-cell">
                    <button
                      className="btn-sm btn-delete"
                      onClick={() => handleDeleteRide(r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rides.length === 0 && <p className="empty-msg">No rides found.</p>}
        </div>
      )}
    </div>
  );
}
