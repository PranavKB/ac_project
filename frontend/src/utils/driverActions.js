import { Modal } from "antd";
import { routeAPI } from "../../api";

export const updateMapRoute = async (source, destination, setMapProps) => {
  if (source && destination) {
    // GeoJSON order is [longitude, latitude]; Leaflet (MapComponent) needs [latitude, longitude]
    const [srcLng, srcLat] = source.location.coordinates;
    const [destLng, destLat] = destination.location.coordinates;
    const srcCoords = [srcLat, srcLng];
    const destCoords = [destLat, destLng];
    const routeCoords = await routeAPI.fetch(
      { lat: srcLat, lng: srcLng },
      { lat: destLat, lng: destLng },
    );
    setMapProps({ source: srcCoords, destination: destCoords, routeCoords });
  }
};

export const executeDriverAction = async (actionFn, successMsg, callback) => {
  try {
    const result = await actionFn();
    if (result.success) {
      Modal.success({ title: "Success", content: successMsg });
      callback();
    } else {
      Modal.error({
        title: "Failed",
        content: result.message || "Operation failed.",
      });
    }
  } catch (err) {
    console.error(err);
    Modal.error({ title: "Error", content: "Failed to perform operation." });
  }
};
