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
@Document(collection = "rideRequests")
public class RideRequest {

    @Id
    private String id;

    private String rideId;
    private String passengerId;
    private String passengerName;

    // Passenger's intended route
    private LocationPoint source;
    private LocationPoint destination;
    private List<String> passengerH3Segments = new ArrayList<>();

    // PENDING, APPROVED, REJECTED, CANCELLED
    private String status = "PENDING";

    // Priority Score = RouteSimilarity + ReputationScore - PickupDistanceKm
    private double priorityScore = 0.0;

    private int requestedSeats = 1;

    private Instant createdAt = Instant.now();
}
