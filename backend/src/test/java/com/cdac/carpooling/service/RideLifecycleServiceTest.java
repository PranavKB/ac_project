package com.cdac.carpooling.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.cdac.carpooling.model.Notification;
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.NotificationRepository;
import com.cdac.carpooling.repository.RideRepository;
import com.cdac.carpooling.repository.UserRepository;

@SpringBootTest
@ActiveProfiles("test")
class RideLifecycleServiceTest {

    @Autowired
    private RideLifecycleService rideLifecycleService;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @BeforeEach
    void setUp() {
        rideRepository.deleteAll();
        userRepository.deleteAll();
        notificationRepository.deleteAll();
    }

    private User saveUser(String email) {
        User user = new User();
        user.setName("Test User");
        user.setEmail(email);
        user.setTotalCarbonSavedKg(0.0);
        return userRepository.save(user);
    }

    @Test
    void expireStaleRides_cancelsActiveRidePastDepartureTime() {
        User driver = saveUser("driver-stale-active@example.com");
        User passenger = saveUser("passenger-stale-active@example.com");

        Ride ride = new Ride();
        ride.setDriverId(driver.getId());
        ride.setStatus("ACTIVE");
        ride.setDepartureTime(Instant.now().minusSeconds(3600));
        ride.setPassengerIds(List.of(passenger.getId()));
        ride.setH3RouteSegments(List.of("h3_1", "h3_2", "h3_3", "h3_4"));
        ride.setRouteCoords(List.of(
                List.of(12.97, 77.59),
                List.of(12.96, 77.60),
                List.of(12.95, 77.61),
                List.of(12.93, 77.64)));
        Ride saved = rideRepository.save(ride);

        rideLifecycleService.expireStaleRides();

        Ride updated = rideRepository.findById(saved.getId()).orElseThrow();
        assertEquals("CANCELLED", updated.getStatus());

        // Only source/destination H3 cells and coordinates should remain
        assertEquals(2, updated.getH3RouteSegments().size());
        assertEquals("h3_1", updated.getH3RouteSegments().get(0));
        assertEquals("h3_4", updated.getH3RouteSegments().get(1));
        assertEquals(2, updated.getRouteCoords().size());
        assertEquals(List.of(12.97, 77.59), updated.getRouteCoords().get(0));
        assertEquals(List.of(12.93, 77.64), updated.getRouteCoords().get(1));

        List<Notification> driverNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(driver.getId());
        assertTrue(driverNotifs.stream().anyMatch(n -> n.getType() == Notification.Type.RIDE_CANCELLED));

        List<Notification> passengerNotifs = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(passenger.getId());
        assertTrue(passengerNotifs.stream().anyMatch(n -> n.getType() == Notification.Type.RIDE_CANCELLED));
    }

    @Test
    void expireStaleRides_leavesActiveRideAlone_whenDepartureStillFuture() {
        User driver = saveUser("driver-future-active@example.com");

        Ride ride = new Ride();
        ride.setDriverId(driver.getId());
        ride.setStatus("ACTIVE");
        ride.setDepartureTime(Instant.now().plusSeconds(3600));
        Ride saved = rideRepository.save(ride);

        rideLifecycleService.expireStaleRides();

        Ride updated = rideRepository.findById(saved.getId()).orElseThrow();
        assertEquals("ACTIVE", updated.getStatus());
    }

    @Test
    void expireStaleRides_completesOngoingRidePastEstimatedEndTime() {
        User driver = saveUser("driver-stale-ongoing@example.com");
        User passenger = saveUser("passenger-stale-ongoing@example.com");

        Ride ride = new Ride();
        ride.setDriverId(driver.getId());
        ride.setStatus("ONGOING");
        // Departed 2 hours ago with a 30-minute estimated duration - well past its expected end
        ride.setDepartureTime(Instant.now().minusSeconds(2 * 3600));
        ride.setEstimatedDurationMinutes(30);
        ride.setPassengerIds(List.of(passenger.getId()));
        Ride.ExecutionDetails details = new Ride.ExecutionDetails();
        details.setStartTime(Instant.now().minusSeconds(2 * 3600));
        ride.setExecutionDetails(details);
        Ride saved = rideRepository.save(ride);

        rideLifecycleService.expireStaleRides();

        Ride updated = rideRepository.findById(saved.getId()).orElseThrow();
        assertEquals("COMPLETED", updated.getStatus());
        assertNotNull(updated.getExecutionDetails().getEndTime());
        assertNotNull(updated.getExecutionDetails().getEnvironmentalOffset());

        User updatedDriver = userRepository.findById(driver.getId()).orElseThrow();
        User updatedPassenger = userRepository.findById(passenger.getId()).orElseThrow();
        assertTrue(updatedDriver.getTotalCarbonSavedKg() > 0);
        assertTrue(updatedPassenger.getTotalCarbonSavedKg() > 0);

        List<Notification> driverNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(driver.getId());
        assertTrue(driverNotifs.stream().anyMatch(n -> n.getType() == Notification.Type.RIDE_COMPLETED));
    }

    @Test
    void expireStaleRides_leavesOngoingRideAlone_whenStillWithinEstimatedDuration() {
        User driver = saveUser("driver-active-ongoing@example.com");

        Ride ride = new Ride();
        ride.setDriverId(driver.getId());
        ride.setStatus("ONGOING");
        // Departed 5 minutes ago with a 60-minute estimated duration - still well in progress
        ride.setDepartureTime(Instant.now().minusSeconds(5 * 60));
        ride.setEstimatedDurationMinutes(60);
        Ride.ExecutionDetails details = new Ride.ExecutionDetails();
        details.setStartTime(Instant.now().minusSeconds(5 * 60));
        ride.setExecutionDetails(details);
        Ride saved = rideRepository.save(ride);

        rideLifecycleService.expireStaleRides();

        Ride updated = rideRepository.findById(saved.getId()).orElseThrow();
        assertEquals("ONGOING", updated.getStatus());
    }
}
