import { useState, useEffect, useRef } from "react";
import { geocode } from "../../api";

export default function LocationInput({ placeholder, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (query.length < 3) return;

    if (skipNextFetch.current) {
      // Reset the flag and skip this fetch
      skipNextFetch.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const data = await geocode(query);
      setResults(data.data || []);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleChange = (e) => {
    const { value } = e.target;
    setQuery(value);

    if (value.length < 3) {
      setResults([]);
    }
  };

  const handleSelect = (item) => {
    // To prevent the useEffect from fetching again when we set the query to the selected item's name
    skipNextFetch.current = true;
    setQuery(item.name);
    setResults([]);

    if (onSelect) {
      // GeoJSON uses [lng, lat]
      const [lng, lat] = item.location.coordinates;
      onSelect({ name: item.name, lat, lng });
    }
  };

  return (
    <div className="location-input-container">
      <input value={query} onChange={handleChange} placeholder={placeholder} />

      {results.length > 0 && (
        <ul className="location-dropdown">
          {results.map((item, i) => (
            <li
              key={i}
              onClick={() => handleSelect(item)}
              className="location-dropdown-item"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
