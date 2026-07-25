package com.cdac.carpooling.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class RoutingService {

    private final RestTemplate restTemplate;

    public RoutingService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Fetches driving route coordinates from OSRM between two points.
     * Returns a list of [latitude, longitude] pairs.
     */
    public List<List<Double>> getRouteCoordinates(double srcLat, double srcLng, double destLat, double destLng) {
        try {
            // Build locale-independent URL using string concatenation to avoid decimal comma formatting
            String url = "https://router.project-osrm.org/route/v1/driving/"
                    + srcLng + "," + srcLat + ";" + destLng + "," + destLat
                    + "?overview=full&geometries=geojson";

            String responseStr = restTemplate.getForObject(url, String.class);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(responseStr);
            JsonNode routes = rootNode.path("routes");

            List<List<Double>> flippedCoordinates = new ArrayList<>();

            if (routes.isArray() && routes.size() > 0) {
                JsonNode route = routes.get(0);
                JsonNode coordinates = route.path("geometry").path("coordinates");

                if (coordinates.isArray()) {
                    for (JsonNode coord : coordinates) {
                        if (coord.isArray() && coord.size() >= 2) {
                            double lng = coord.get(0).asDouble();
                            double lat = coord.get(1).asDouble();
                            flippedCoordinates.add(List.of(lat, lng));
                        }
                    }
                }
            }

            return flippedCoordinates;

        } catch (Exception e) {
            // Fallback to simple straight line path [source, destination] if OSRM fails
            return List.of(List.of(srcLat, srcLng), List.of(destLat, destLng));
        }
    }
}
