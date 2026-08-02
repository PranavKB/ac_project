package com.cdac.carpooling.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.cdac.carpooling.model.LocationPoint;
import com.cdac.carpooling.model.Notification;
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.repository.RideRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Owns ride-completion bookkeeping (shared by the driver-initiated
 * /complete endpoint and the automatic sweep below) plus a scheduled sweep
 * that resolves rides whose scheduled time has passed without the driver
 * ever confirming what actually happened:
 * - ACTIVE (never started) past departure time -> CANCELLED
 * - ONGOING past its estimated end time -> COMPLETED
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RideLifecycleService {

    private static final double DEFAULT_AUTO_COMPLETE_DISTANCE_KM = 10.0;

    private final RideRepository rideRepository;
    private final CarbonService carbonService;
    private final NotificationService notificationService;

    public Ride completeRide(Ride ride, double actualDistanceKm) {
        ride.setStatus("COMPLETED");

        // Keep only start and end H3 segments, deleting the intermediate path cells to
        // save storage space
        List<String> h3Segments = ride.getH3RouteSegments();
        if (h3Segments != null && h3Segments.size() >= 2) {
            ride.setH3RouteSegments(List.of(h3Segments.get(0), h3Segments.get(h3Segments.size() - 1)));
        }
        List<List<Double>> routeCoords = ride.getRouteCoords();
        if (routeCoords != null && routeCoords.size() >= 2) {
            ride.setRouteCoords(List.of(routeCoords.get(0), routeCoords.get(routeCoords.size() - 1)));
        }

        Ride.ExecutionDetails details = new Ride.ExecutionDetails();
        details.setStartTime(ride.getExecutionDetails() != null ? ride.getExecutionDetails().getStartTime() : null);
        details.setEndTime(Instant.now());
        details.setActualDistanceKm(actualDistanceKm);

        int passengerCount = ride.getPassengerIds() != null ? ride.getPassengerIds().size() : 0;
        Ride.EnvironmentalOffset offset = carbonService.calculateOffset(actualDistanceKm, Math.max(1, passengerCount));
        details.setEnvironmentalOffset(offset);

        List<LocationPoint.GeoJsonPoint> traj = new ArrayList<>();
        if (ride.getSource() != null && ride.getSource().getLocation() != null) {
            traj.add(ride.getSource().getLocation());
        }
        if (ride.getDestination() != null && ride.getDestination().getLocation() != null) {
            traj.add(ride.getDestination().getLocation());
        }
        details.setActualTrajectoryPoints(traj);

        ride.setExecutionDetails(details);

        Ride saved = rideRepository.save(ride);

        carbonService.creditCarbonToDriver(ride.getDriverId(), offset.getNetReducedCo2Kg());
        notificationService.create(ride.getDriverId(), Notification.Type.RIDE_COMPLETED, "Ride completed",
                "Your ride is complete: " + offset.getNetReducedCo2Kg() + " kg CO2 saved.", saved.getId());

        if (ride.getPassengerIds() != null) {
            double passengerCo2 = carbonService.calculatePassengerOffset(actualDistanceKm);
            for (String passengerId : ride.getPassengerIds()) {
                carbonService.creditCarbonToUser(passengerId, passengerCo2);
                notificationService.create(passengerId, Notification.Type.RIDE_COMPLETED, "Ride completed",
                        "Your ride is complete: " + passengerCo2 + " kg CO2 saved.", saved.getId());
            }
        }

        return saved;
    }

    private void cancelRide(Ride ride) {
        ride.setStatus("CANCELLED");
        Ride saved = rideRepository.save(ride);

        notificationService.create(ride.getDriverId(), Notification.Type.RIDE_CANCELLED,
                "Ride auto-cancelled",
                "Your ride scheduled for " + ride.getDepartureTime() + " was automatically cancelled because it was never started.",
                saved.getId());

        if (ride.getPassengerIds() != null) {
            for (String passengerId : ride.getPassengerIds()) {
                notificationService.create(passengerId, Notification.Type.RIDE_CANCELLED,
                        "Ride cancelled",
                        "A ride you booked was automatically cancelled because the driver never started it.",
                        saved.getId());
            }
        }
    }

    // Sweeps every 5 minutes for rides whose scheduled time has passed without a
    // matching status transition from the driver.
    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void expireStaleRides() {
        Instant now = Instant.now();

        List<Ride> activeRides = rideRepository.findByStatus("ACTIVE");
        for (Ride ride : activeRides) {
            if (ride.getDepartureTime() != null && ride.getDepartureTime().isBefore(now)) {
                cancelRide(ride);
                log.info("Auto-cancelled ride {} - departure time passed without being started", ride.getId());
            }
        }

        List<Ride> ongoingRides = rideRepository.findByStatus("ONGOING");
        for (Ride ride : ongoingRides) {
            if (ride.getDepartureTime() == null) {
                continue;
            }
            Instant expectedEnd = ride.getDepartureTime()
                    .plusSeconds(Math.max(ride.getEstimatedDurationMinutes(), 0) * 60L);
            if (expectedEnd.isBefore(now)) {
                completeRide(ride, DEFAULT_AUTO_COMPLETE_DISTANCE_KM);
                log.info("Auto-completed ride {} - estimated end time passed", ride.getId());
            }
        }
    }
}
