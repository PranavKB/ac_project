package com.cdac.carpooling.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.cdac.carpooling.dto.ApiResponse;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/route")
public class RouteController {

    private final RestTemplate restTemplate;

    public RouteController() {
        this.restTemplate = new RestTemplate();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getRoute(
            @RequestParam double srcLat,
            @RequestParam double srcLng,
            @RequestParam double destLat,
            @RequestParam double destLng) {
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

            return ApiResponse.success(flippedCoordinates, "Route fetched successfully");

        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch route data: " + e.getMessage());
        }
    }
}
