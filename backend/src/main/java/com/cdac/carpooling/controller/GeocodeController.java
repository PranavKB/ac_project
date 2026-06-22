package com.cdac.carpooling.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.dto.GeoJsonDto;
import com.cdac.carpooling.dto.LocationDto;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/geocode")
public class GeocodeController {

    private final RestClient restClient;

    @Value("${geocoding.api.key}")
    private String apiKey;

    public GeocodeController() {
        this.restClient = RestClient.create("https://api.geoapify.com/v1/geocode");
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getCoordinates(@RequestParam String text) {
        try {
            // Raw GeoJSON response from Geoapify
            String responseStr = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/autocomplete")
                            .queryParam("text", text)
                            .queryParam("apiKey", apiKey)
                            .build())
                    .retrieve()
                    .body(String.class);

            // Parsing the response using standard Jackson ObjectMapper
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(responseStr);
            JsonNode features = rootNode.path("features");

            List<LocationDto> extractedLocations = new ArrayList<>();

            // Extracting the features array and convert to LocationDto structures
            if (features.isArray()) {
                for (JsonNode feature : features) {
                    JsonNode properties = feature.path("properties");

                    String name = properties.path("name").asString();

                    if (name == null || name.trim().isEmpty()) {
                        name = properties.path("city").asString();

                        if (name == null || name.trim().isEmpty()) {
                            name = "Unknown Location";
                        }
                    }

                    JsonNode coordinatesNode = feature.path("geometry").path("coordinates");
                    if (coordinatesNode.isArray() && coordinatesNode.size() >= 2) {
                        double longitude = coordinatesNode.get(0).asDouble();
                        double latitude = coordinatesNode.get(1).asDouble();

                        GeoJsonDto geoJsonDto = new GeoJsonDto();
                        geoJsonDto.setType("Point");
                        geoJsonDto.setCoordinates(List.of(longitude, latitude));

                        LocationDto locationDto = new LocationDto();
                        locationDto.setName(name);
                        locationDto.setLocation(geoJsonDto);

                        extractedLocations.add(locationDto);
                    }
                }
            }

            return ApiResponse.success(extractedLocations, "Locations fetched successfully");

        } catch (Exception e) {
            return ApiResponse.error("Failed to process location data: " + e.getMessage());
        }
    }
}
