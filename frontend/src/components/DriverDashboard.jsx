import { useState } from "react";

import MapComponent from "./MapComponent";
import PublishRide from "./PublishRide";

function DriverDashboard() {
  const [showMap, setShowMap] = useState(false);
  const [mapProps, setMapProps] = useState({
    source: null,
    destination: null,
    routeCoords: null,
  });

  const handleMapUpdate = (props) => {
    setMapProps(props);
    setShowMap(true);
  };

  return (
    <>
      <PublishRide onMapUpdate={handleMapUpdate} />

      <div
        className="flex-col"
        style={{ gap: 24, width: "100%", alignItems: "center" }}
      >
        {showMap && (
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              height: "450px",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <MapComponent
              source={mapProps.source}
              destination={mapProps.destination}
              routeCoords={mapProps.routeCoords}
              currentLocation={null}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default DriverDashboard;
