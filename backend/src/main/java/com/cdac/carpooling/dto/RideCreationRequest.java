package com.cdac.carpooling.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RideCreationRequest {

    @NotBlank(message = "Driver ID is required")
    private String driverId;

    @NotBlank(message = "Driver name is required")
    private String driverName;

    @NotNull(message = "Total seats configuration is required")
    @Min(value = 1, message = "A ride must offer at least 1 seat")
    private Integer totalSeats;

    private String departureTime;

    @NotNull(message = "Source location is required")
    @Valid
    private LocationDto source;

    @NotNull(message = "Destination location is required")
    @Valid 
    private LocationDto destination;

    @Data
    public static class LocationDto {
        @NotBlank(message = "Location name is required")
        private String name;

        @NotNull(message = "Geo coordinates object wrapper is required")
        @Valid
        private GeoJsonDto location;
    }

    @Data
    public static class GeoJsonDto {
        private String type = "Point";

        @NotNull(message = "Coordinates array cannot be null")
        private List<Double> coordinates;
    }
}
