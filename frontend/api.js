import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

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
