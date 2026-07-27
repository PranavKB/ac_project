import axios from "axios";

export const BASE_URL = "http://localhost:8080";

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to inject the JWT token into the Authorization header
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token expiration/unauthorized errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("activeRole");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const geocode = async (text) => {
  const response = await API.get(`/geocode?text=${encodeURIComponent(text)}`);
  return response.data;
};

export const getUserDetails = async (userId) => {
  const response = await API.get(`/users/${userId}`);
  return response.data;
};

export const authAPI = {
  login: async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    return res.data;
  },
  requestRegisterLink: async (email) => {
    const res = await API.post("/auth/request-register-link", { email });
    return res.data;
  },
  verifyToken: async (token) => {
    const res = await API.get(
      `/auth/verify-token?token=${encodeURIComponent(token)}`,
    );
    return res.data;
  },
  register: async (name, email, phone, password, roles, token) => {
    const res = await API.post("/auth/register", {
      name,
      email,
      phone,
      password,
      roles,
      token,
    });
    return res.data;
  },
};

export const rideAPI = {
  create: async (rideData) => {
    const res = await API.post("/rides", rideData);
    return res.data;
  },
  search: async (searchData) => {
    const res = await API.post("/rides/search", searchData);
    return res.data;
  },
  getByDriver: async (driverId) => {
    const res = await API.get(`/rides/driver/${driverId}`);
    return res.data;
  },
  get: async (id) => {
    const res = await API.get(`/rides/${id}`);
    return res.data;
  },
  start: async (id) => {
    const res = await API.post(`/rides/${id}/start`);
    return res.data;
  },
  complete: async (id, actualDistanceKm) => {
    const res = await API.post(`/rides/${id}/complete`, { actualDistanceKm });
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await API.put(`/rides/${id}/status`, { status });
    return res.data;
  },
};

export const routeAPI = {
  fetch: async (src, dest) => {
    const res = await API.get("/route", {
      params: {
        srcLat: src.lat,
        srcLng: src.lng,
        destLat: dest.lat,
        destLng: dest.lng,
      },
    });
    return res.data?.data || [];
  },
};

export const requestAPI = {
  create: async (reqData) => {
    const res = await API.post("/requests", reqData);
    return res.data;
  },
  approve: async (id) => {
    const res = await API.put(`/requests/${id}/approve`);
    return res.data;
  },
  reject: async (id) => {
    const res = await API.put(`/requests/${id}/reject`);
    return res.data;
  },
  cancel: async (id) => {
    const res = await API.put(`/requests/${id}/cancel`);
    return res.data;
  },
  getByRide: async (rideId) => {
    const res = await API.get(`/requests/ride/${rideId}`);
    return res.data;
  },
  getByPassenger: async (passengerId) => {
    const res = await API.get(`/requests/passenger/${passengerId}`);
    return res.data;
  },
};

export const messageAPI = {
  send: async (msgData) => {
    const res = await API.post("/messages", msgData);
    return res.data;
  },
  getByRide: async (rideId) => {
    const res = await API.get(`/messages/ride/${rideId}`);
    return res.data;
  },
};

export const userAPI = {
  get: async (id) => {
    const res = await API.get(`/users/${id}`);
    return res.data;
  },
  update: async (id, userData) => {
    const res = await API.put(`/users/${id}`, userData);
    return res.data;
  },
};

export const adminAPI = {
  getOverviewStats: async () => {
    const res = await API.get("/admin/stats/overview");
    return res.data;
  },
  getUsers: async () => {
    const res = await API.get("/admin/users");
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await API.delete(`/admin/users/${id}`);
    return res.data;
  },
  getRides: async () => {
    const res = await API.get("/admin/rides");
    return res.data;
  },
  deleteRide: async (id) => {
    const res = await API.delete(`/admin/rides/${id}`);
    return res.data;
  },
  getEnvironmentalAnalytics: async () => {
    const res = await API.get("/admin/analytics/environmental");
    return res.data;
  },
  getReputationAnalytics: async () => {
    const res = await API.get("/admin/analytics/reputation");
    return res.data;
  },
};
