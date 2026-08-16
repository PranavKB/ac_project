import { useState, useEffect, useRef } from "react";
import { AutoComplete, Input } from "antd";
import { geocode } from "../../api";
import { EnvironmentOutlined } from "@ant-design/icons";

const FALLBACK_CITIES = [
  { name: "Bengaluru, Karnataka, India", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad, Telangana, India", lat: 17.385, lng: 78.4867 },
  { name: "Kakinada, Andhra Pradesh, India", lat: 16.9891, lng: 82.2475 },
  { name: "Visakhapatnam, Andhra Pradesh, India", lat: 17.6868, lng: 83.2185 },
  { name: "Chennai, Tamil Nadu, India", lat: 13.0827, lng: 80.2707 },
  { name: "Mumbai, Maharashtra, India", lat: 19.076, lng: 72.8777 },
  { name: "Pune, Maharashtra, India", lat: 18.5204, lng: 73.8567 },
  { name: "New Delhi, Delhi, India", lat: 28.6139, lng: 77.209 },
];

export default function LocationInput({
  value = "",
  placeholder,
  onSelect,
  prefix,
}) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState([]);
  const skipNextFetch = useRef(false);

  // Synchronize internal query state with value prop changes (e.g., during a swap operation)
  useEffect(() => {
    if (value !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (query.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptions([]);
      return;
    }

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await geocode(query);
        const results = response?.data || response || [];
        setOptions(
          results.map((item, idx) => ({
            key: `${item.name}-${idx}`,
            value: item.name,
            label: (
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <EnvironmentOutlined style={{ color: "#00aff5" }} />
                <span
                  style={{
                    fontSize: "0.9rem",
                    color: "#054752",
                    fontWeight: 500,
                  }}
                >
                  {item.name}
                </span>
              </div>
            ),
            raw: item,
          })),
        );
      } catch (err) {
        console.warn(
          "Geocoding API failed, falling back to local cities list:",
          err,
        );
        const queryLower = query.toLowerCase();
        const matches = FALLBACK_CITIES.filter((city) =>
          city.name.toLowerCase().includes(queryLower),
        ).map((city) => ({
          name: city.name,
          location: {
            type: "Point",
            coordinates: [city.lng, city.lat], // GeoJSON order
          },
        }));

        setOptions(
          matches.map((item, idx) => ({
            key: `${item.name}-fallback-${idx}`,
            value: item.name,
            label: (
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <EnvironmentOutlined style={{ color: "#faad14" }} />
                <span
                  style={{
                    fontSize: "0.9rem",
                    color: "#054752",
                    fontWeight: 500,
                  }}
                >
                  {item.name} (Offline)
                </span>
              </div>
            ),
            raw: item,
          })),
        );
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (value, option) => {
    skipNextFetch.current = true;
    setQuery(value);
    if (onSelect && option.raw) {
      const [lng, lat] = option.raw.location.coordinates;
      onSelect({ name: option.raw.name, lat, lng });
    }
  };

  const defaultPrefix =
    prefix !== undefined ? (
      prefix
    ) : (
      <EnvironmentOutlined style={{ color: "#708c91" }} />
    );

  return (
    <AutoComplete
      value={query}
      options={options}
      onSearch={setQuery}
      onSelect={handleSelect}
      style={{ width: "100%" }}
    >
      <Input size="large" placeholder={placeholder} prefix={defaultPrefix} />
    </AutoComplete>
  );
}
