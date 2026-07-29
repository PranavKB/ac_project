import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Overwrite Leaflet default marker icons to avoid Vite import issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/assets/leaflet/marker-icon-2x.png",
  iconUrl: "/assets/leaflet/marker-icon.png",
  shadowUrl: "/assets/leaflet/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl: "/assets/leaflet/marker-icon-red.png",
  shadowUrl: "/assets/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const greenIcon = new L.Icon({
  iconUrl: "/assets/leaflet/marker-icon-green.png",
  shadowUrl: "/assets/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl: "/assets/leaflet/marker-icon-blue.png",
  shadowUrl: "/assets/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const orangeIcon = new L.Icon({
  iconUrl: "/assets/leaflet/marker-icon-orange.png",
  shadowUrl: "/assets/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Dynamic viewport adjustments
function ChangeView({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

// source, destination, currentLocation, and each waypoint's `coords` are Leaflet
// LatLngExpressions: [latitude, longitude]. Backend LocationPoint/Ride.currentLocation
// values are GeoJSON [longitude, latitude] and must be flipped before being passed in here
export default function MapComponent({
  source,
  destination,
  routeCoords,
  currentLocation,
  waypoints,
}) {
  // Bangalore
  const defaultCenter = [12.9716, 77.5946];

  // Calculate bounding box to fit path
  const isValidCoord = (c) =>
    Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1]);
  let bounds = [];
  if (source && isValidCoord(source)) bounds.push(source);
  if (destination && isValidCoord(destination)) bounds.push(destination);
  if (routeCoords && routeCoords.length > 0) {
    routeCoords.forEach((c) => {
      if (isValidCoord(c)) bounds.push(c);
    });
  }
  if (currentLocation && isValidCoord(currentLocation))
    bounds.push(currentLocation);

  const center = source ? source : defaultCenter;

  const mapKey =
    source && destination
      ? `${source[0]},${source[1]}-${destination[0]},${destination[1]}`
      : "default";

  return (
    <div key={mapKey} className="map-container-wrapper">
      <MapContainer center={center} zoom={12} className="map-container-inner">
        <ChangeView
          center={center}
          zoom={12}
          bounds={bounds.length > 0 ? bounds : null}
        />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Source Pin */}
        {source && (
          <Marker position={source} icon={redIcon}>
            <Popup>Source Location</Popup>
          </Marker>
        )}

        {/* Destination Pin */}
        {destination && (
          <Marker position={destination} icon={greenIcon}>
            <Popup>Destination Location</Popup>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoords && routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            color="#3b82f6"
            weight={5}
            opacity={0.75}
            lineCap="round"
          />
        )}

        {/* Live Driver Position Pin */}
        {currentLocation && (
          <Marker position={currentLocation} icon={blueIcon}>
            <Popup>Driver's Current Position</Popup>
          </Marker>
        )}

        {/* Extra Waypoints */}
        {waypoints &&
          waypoints.map((wp, idx) => (
            <Marker key={idx} position={wp.coords} icon={orangeIcon}>
              <Popup>{wp.label || "Waypoint"}</Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
