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
     * with the passenger's source to destination route AND travels in the same direction.
     */
    public List<Map<String, Object>> findMatchingRides(double pSrcLat, double pSrcLng, double pDestLat, double pDestLng, List<String> passengerH3, String departureDate) {
        List<Ride> candidateRides;
        List<String> allowedStatuses = List.of("ACTIVE", "ONGOING");

        if (departureDate != null && !departureDate.isBlank()) {
            try {
                java.time.LocalDate date = java.time.LocalDate.parse(departureDate);
                java.time.Instant startOfDay = date.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                java.time.Instant endOfDay = date.plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                candidateRides = rideRepository.findByDepartureTimeBetweenAndStatusIn(startOfDay, endOfDay, allowedStatuses);
            } catch (Exception e) {
                candidateRides = rideRepository.findByStatusIn(allowedStatuses);
            }
        } else {
            candidateRides = rideRepository.findByStatusIn(allowedStatuses);
        }

        List<Map<String, Object>> matches = new ArrayList<>();

        for (Ride ride : candidateRides) {
            if (ride.getAvailableSeats() <= 0)
                continue;

            // Enforce direction and route proximity
            if (!isSameDirectionAndOnRoute(ride, pSrcLat, pSrcLng, pDestLat, pDestLng)) {
                continue;
            }

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

    private boolean isSameDirectionAndOnRoute(Ride ride, double pSrcLat, double pSrcLng, double pDestLat, double pDestLng) {
        List<List<Double>> routeCoords = ride.getRouteCoords();
        if (routeCoords == null || routeCoords.isEmpty()) {
            // Fallback to checking source and destination coordinates if routeCoords is empty
            if (ride.getSource() != null && ride.getSource().getLocation() != null && ride.getSource().getLocation().getCoordinates() != null &&
                ride.getDestination() != null && ride.getDestination().getLocation() != null && ride.getDestination().getLocation().getCoordinates() != null) {
                double[] s = ride.getSource().getLocation().getCoordinates();
                double[] d = ride.getDestination().getLocation().getCoordinates();
                double dSrc = h3Service.haversineKm(pSrcLat, pSrcLng, s[1], s[0]);
                double dDest = h3Service.haversineKm(pDestLat, pDestLng, d[1], d[0]);
                return dSrc <= 50.0 && dDest <= 50.0;
            }
            return true;
        }

        int pickupIdx = -1;
        double minPickupDist = Double.MAX_VALUE;

        int dropoffIdx = -1;
        double minDropoffDist = Double.MAX_VALUE;

        for (int i = 0; i < routeCoords.size(); i++) {
            List<Double> coord = routeCoords.get(i);
            double rLat = coord.get(0);
            double rLng = coord.get(1);

            double dSrc = h3Service.haversineKm(pSrcLat, pSrcLng, rLat, rLng);
            if (dSrc < minPickupDist) {
                minPickupDist = dSrc;
                pickupIdx = i;
            }

            double dDest = h3Service.haversineKm(pDestLat, pDestLng, rLat, rLng);
            if (dDest < minDropoffDist) {
                minDropoffDist = dDest;
                dropoffIdx = i;
            }
        }

        // Must be within 50 km proximity of the route path
        if (minPickupDist > 50.0 || minDropoffDist > 50.0) {
            return false;
        }

        // Direction check: Driver MUST reach passenger pickup location BEFORE dropoff location
        return pickupIdx < dropoffIdx;
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
