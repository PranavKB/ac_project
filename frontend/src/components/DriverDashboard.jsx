import { useState } from "react";
/* eslint-disable no-unused-vars */
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

      {/* {showMap && (
        <div style={{ width: "800px", height: "450px" }}>
          <MapComponent
            source={mapProps.source}
            destination={mapProps.destination}
            routeCoords={mapProps.routeCoords}
            currentLocation={null}
          />
        </div>
      )} */}
    </>
  );
}

export default DriverDashboard;
