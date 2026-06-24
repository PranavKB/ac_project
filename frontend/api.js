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
