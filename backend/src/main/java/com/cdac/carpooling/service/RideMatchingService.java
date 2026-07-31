package com.cdac.carpooling.service;

import lombok.RequiredArgsConstructor;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.cdac.carpooling.model.Notification;
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.model.RideRequest;
import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.RideRepository;
import com.cdac.carpooling.repository.RideRequestRepository;
import com.cdac.carpooling.repository.UserRepository;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RideMatchingService {

    private final H3Service h3Service;
    private final RideRepository rideRepository;
    private final RoutingService routingService;
    private final RideRequestRepository rideRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private static final double SIMILARITY_THRESHOLD = 0.70;
    private static final double DEFAULT_REPUTATION = 80.0;

    /**
     * Pre-trip matching: find ACTIVE rides whose H3 route overlaps >= threshold
     * with the passenger's source to destination route AND travels in the same
     * direction.
     */
    public List<Map<String, Object>> findMatchingRides(double pSrcLat, double pSrcLng, double pDestLat, double pDestLng,
            List<String> passengerH3, String departureDate, Integer requestedSeats, String excludeDriverId) {
        int minSeats = (requestedSeats != null && requestedSeats > 0) ? requestedSeats : 1;
        List<Ride> candidateRides;
        List<String> allowedStatuses = List.of("ACTIVE", "ONGOING");

        if (departureDate != null && !departureDate.isBlank()) {
            try {
                java.time.LocalDate date = java.time.LocalDate.parse(departureDate);
                java.time.Instant startOfDay = date.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                java.time.Instant endOfDay = date.plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault())
                        .toInstant();
                candidateRides = rideRepository.findByDepartureTimeBetweenAndStatusIn(startOfDay, endOfDay,
                        allowedStatuses);
            } catch (Exception e) {
                candidateRides = rideRepository.findByStatusIn(allowedStatuses);
            }
        } else {
            candidateRides = rideRepository.findByStatusIn(allowedStatuses);
        }

        List<Map<String, Object>> matches = new ArrayList<>();

        for (Ride ride : candidateRides) {
            if (excludeDriverId != null && excludeDriverId.equals(ride.getDriverId()))
                continue;

            if (ride.getAvailableSeats() < minSeats)
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

    private boolean isSameDirectionAndOnRoute(Ride ride, double pSrcLat, double pSrcLng, double pDestLat,
            double pDestLng) {
        List<List<Double>> routeCoords = ride.getRouteCoords();
        if (routeCoords == null || routeCoords.isEmpty()) {
            // Fallback to checking source and destination coordinates if routeCoords is
            // empty
            if (ride.getSource() != null && ride.getSource().getLocation() != null
                    && ride.getSource().getLocation().getCoordinates() != null &&
                    ride.getDestination() != null && ride.getDestination().getLocation() != null
                    && ride.getDestination().getLocation().getCoordinates() != null) {
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

        // Direction check: Driver MUST reach passenger pickup location BEFORE dropoff
        // location
        return pickupIdx < dropoffIdx;
    }

    /**
     * Dynamic ad-hoc rematching: triggered when a confirmed
     * passenger cancels mid-route. Ranks the other PENDING requests on this ride by
     * Priority Score = RouteSimilarity(0-100) + ReputationAvg - PickupDistanceKm,
     * persists
     * the score, and notifies the driver of the top candidate. Pre-trip (ACTIVE
     * ride)
     * cancellations are plain seat release and do not trigger this.
     */
    public void rankAndSuggestBackupCandidates(Ride ride, String vacatedPassengerId) {
        if (ride == null || !"ONGOING".equals(ride.getStatus())) {
            return;
        }

        List<RideRequest> candidates = rideRequestRepository.findByRideIdAndStatus(ride.getId(), "PENDING");
        if (candidates.isEmpty()) {
            return;
        }

        double[] currentLocation = ride.getCurrentLocation() != null && ride.getCurrentLocation().size() == 2
                ? new double[] { ride.getCurrentLocation().get(0), ride.getCurrentLocation().get(1) }
                : null;

        RideRequest topCandidate = null;
        double topScore = Double.NEGATIVE_INFINITY;

        for (RideRequest candidate : candidates) {
            double similarity = h3Service.calculateSimilarity(ride.getH3RouteSegments(),
                    candidate.getPassengerH3Segments());

            double reputationAvg = userRepository.findById(candidate.getPassengerId())
                    .map(User::getReputationProfile)
                    .map(profile -> (profile.getTrustScore() + profile.getReliabilityScore()
                            + profile.getComfortScore()) / 3.0)
                    .orElse(DEFAULT_REPUTATION);

            double pickupDistanceKm = 0.0;
            if (currentLocation != null && candidate.getSource() != null
                    && candidate.getSource().getLocation() != null
                    && candidate.getSource().getLocation().getCoordinates() != null) {
                double[] pickup = candidate.getSource().getLocation().getCoordinates();
                pickupDistanceKm = h3Service.haversineKm(currentLocation[1], currentLocation[0], pickup[1],
                        pickup[0]);
            }

            double priorityScore = similarity * 100 + reputationAvg - pickupDistanceKm;
            candidate.setPriorityScore(priorityScore);
            rideRequestRepository.save(candidate);

            if (priorityScore > topScore) {
                topScore = priorityScore;
                topCandidate = candidate;
            }
        }

        if (topCandidate != null && topScore > 0) {
            String candidateName = topCandidate.getPassengerName() != null ? topCandidate.getPassengerName()
                    : "A waiting passenger";
            notificationService.create(ride.getDriverId(), Notification.Type.BACKUP_CANDIDATE_SUGGESTED,
                    "Backup rider suggested",
                    candidateName + " is a strong backup match for your open seat.", ride.getId());
        }
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
