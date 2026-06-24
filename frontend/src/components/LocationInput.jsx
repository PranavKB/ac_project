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
      const [lat, lng] = item.location.coordinates;
      onSelect({ name: item.name, lat, lng });
    }
  };

  return (
    <div style={{ position: "relative", marginBottom: "15px" }}>
      <input
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
      />

      {results.length > 0 && (
        <ul
          style={{
            position: "absolute",
            background: "#fff",
            border: "1px solid #ccc",
            width: "100%",
            zIndex: 10,
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {results.map((item, i) => (
            <li
              key={i}
              onClick={() => handleSelect(item)}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
