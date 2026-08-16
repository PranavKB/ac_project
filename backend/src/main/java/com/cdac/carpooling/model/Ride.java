package com.cdac.carpooling.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "rides")
public class Ride {

    @Id
    private String id;

    private String driverId;
    private String driverName;

    private LocationPoint source;
    private LocationPoint destination;

    private List<String> h3RouteSegments = new ArrayList<>();

    // Full polyline coordinates [[lat,lng],...] for maps
    private List<List<Double>> routeCoords = new ArrayList<>();

    private Instant departureTime;

    private Instant createdAt = Instant.now();

    // Arrival time derived as: departureTime + estimatedDurationMinutes
    private int estimatedDurationMinutes;

    // Price per seat in INR
    private Double pricePerSeat;

    private int availableSeats;
    private int totalSeats;

    // ACTIVE -> ONGOING -> COMPLETED
    private String status = "ACTIVE";

    private List<String> passengerIds = new ArrayList<>();

    private List<Double> currentLocation;

    private ExecutionDetails executionDetails;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecutionDetails {
        private Instant startTime;
        private Instant endTime;
        private double actualDistanceKm;
        private List<LocationPoint.GeoJsonPoint> actualTrajectoryPoints = new ArrayList<>();
        private EnvironmentalOffset environmentalOffset;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnvironmentalOffset {
        private double avoidedFuelLiters;
        private double netReducedCo2Kg;
    }
}
