import { Modal } from "antd";
import { routeAPI } from "../../api";

export const updateMapRoute = async (source, destination, setMapProps) => {
  if (source && destination) {
    const srcCoords = [
      source.location.coordinates[0],
      source.location.coordinates[1],
    ];
    const destCoords = [
      destination.location.coordinates[0],
      destination.location.coordinates[1],
    ];
    const routeCoords = await routeAPI.fetch(
      { lat: srcCoords[0], lng: srcCoords[1] },
      { lat: destCoords[0], lng: destCoords[1] },
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
