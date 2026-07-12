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
  register: async (name, email, phone, password, roles) => {
    const res = await API.post("/auth/register", {
      name,
      email,
      phone,
      password,
      roles,
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
    const url = `https://router.project-osrm.org/route/v1/driving/${src.lng},${src.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      // GeoJSON coords are [lng, lat] — flip to [lat, lng] for Leaflet
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [
        lat,
        lng,
      ]);
    }
    return [];
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
