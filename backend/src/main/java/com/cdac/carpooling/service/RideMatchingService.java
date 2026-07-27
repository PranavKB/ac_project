package com.cdac.carpooling.service;

import lombok.RequiredArgsConstructor;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.repository.RideRepository;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RideMatchingService {

    private final H3Service h3Service;
    private final RideRepository rideRepository;
    private final RoutingService routingService;
    private static final double SIMILARITY_THRESHOLD = 0.70;

    /**
     * Pre-trip matching: find ACTIVE rides whose H3 route overlaps >= threshold
     * with the passenger's source to destination route.
     */
    public List<Map<String, Object>> findMatchingRides(List<String> passengerH3) {
        List<Ride> activeRides = rideRepository.findByStatus("ACTIVE");
        List<Map<String, Object>> matches = new ArrayList<>();

        for (Ride ride : activeRides) {
            if (ride.getAvailableSeats() <= 0)
                continue;
            double similarity = h3Service.calculateSimilarity(ride.getH3RouteSegments(), passengerH3);
            if (similarity >= SIMILARITY_THRESHOLD) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("ride", ride);
                entry.put("similarityScore", Math.round(similarity * 100.0) / 100.0);
                matches.add(entry);
            }
        }

        matches.sort((a, b) -> Double.compare((double) b.get("similarityScore"), (double) a.get("similarityScore")));
        return matches;
    }

    @Async
    public void populateRouteH3SegmentsAsync(String rideId, double srcLat, double srcLng, double destLat,
            double destLng) {
        try {
            List<List<Double>> routeCoords = routingService.getRouteCoordinates(srcLat, srcLng, destLat, destLng);
            List<String> fullH3 = h3Service.pathToH3Segments(routeCoords);

            Ride ride = rideRepository.findById(rideId).orElse(null);
            if (ride != null && "ACTIVE".equals(ride.getStatus())) {
                ride.setH3RouteSegments(fullH3);
                ride.setRouteCoords(routeCoords);
                rideRepository.save(ride);
            }
        } catch (Exception e) {
            System.err.println("Async H3 generation failed: " + e.getMessage());
        }
    }
}
