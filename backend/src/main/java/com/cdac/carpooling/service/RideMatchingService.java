package com.cdac.carpooling.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.repository.RideRepository;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RideMatchingService {

    private final H3Service h3Service;
    private final RideRepository rideRepository;
    private static final double SIMILARITY_THRESHOLD = 0.70;
    /**
     * Pre-trip matching: find ACTIVE rides whose H3 route overlaps >= threshold
     * with the passenger's source to destination route.
     */
    public List<Map<String, Object>> findMatchingRides(List<String> passengerH3) {
        List<Ride> activeRides = rideRepository.findByStatus("ACTIVE");
        List<Map<String, Object>> matches = new ArrayList<>();

        for (Ride ride : activeRides) {
            if (ride.getAvailableSeats() <= 0) continue;
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
    
}



