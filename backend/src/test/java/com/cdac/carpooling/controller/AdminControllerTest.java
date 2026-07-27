package com.cdac.carpooling.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.cdac.carpooling.model.LocationPoint;
import com.cdac.carpooling.model.Rating;
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.model.RideRequest;
import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.RatingRepository;
import com.cdac.carpooling.repository.RideRepository;
import com.cdac.carpooling.repository.RideRequestRepository;
import com.cdac.carpooling.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Filters are intentionally left enabled (no addFilters=false) so the
 * hasRole("ADMIN") lockdown configured in SecurityConfig actually runs.
 * Because the security context is stateless (JWT-only), authentication has
 * to come from a real login-issued token rather than @WithMockUser: under
 * SessionCreationPolicy.STATELESS the SecurityContextHolderFilter resets the
 * context to empty before JwtAuthenticationFilter runs, which would wipe out
 * whatever @WithMockUser seeded.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerTest {

    private static final String RAW_PASSWORD = "Password@123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private RideRequestRepository rideRequestRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        rideRepository.deleteAll();
        rideRequestRepository.deleteAll();
        ratingRepository.deleteAll();
    }

    private User saveUser(String name, String email, List<String> roles, double trust, double reliability,
            double comfort, double carbonSavedKg) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone("9999999999");
        user.setPassword(passwordEncoder.encode(RAW_PASSWORD));
        user.setRoles(roles);
        user.setReputationProfile(new User.ReputationProfile(trust, reliability, comfort, "summary"));
        user.setTotalCarbonSavedKg(carbonSavedKg);
        user.setCreatedAt(Instant.now());
        return userRepository.save(user);
    }

    @SuppressWarnings("unchecked")
    private String loginAs(String email) throws Exception {
        String loginPayload = """
                { "email": "%s", "password": "%s" }
                """.formatted(email, RAW_PASSWORD);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload))
                .andExpect(status().isOk())
                .andReturn();

        Map<String, Object> response = new ObjectMapper()
                .readValue(result.getResponse().getContentAsString(), Map.class);
        Map<String, Object> data = (Map<String, Object>) response.get("data");
        return (String) data.get("token");
    }

    private Ride saveRide(String driverName, String status, Ride.EnvironmentalOffset offset, Instant endTime) {
        Ride ride = new Ride();
        ride.setDriverId("driver-id");
        ride.setDriverName(driverName);
        ride.setTotalSeats(4);
        ride.setAvailableSeats(4);
        ride.setStatus(status);

        LocationPoint source = new LocationPoint();
        source.setName("Source City");
        LocationPoint destination = new LocationPoint();
        destination.setName("Destination City");
        ride.setSource(source);
        ride.setDestination(destination);

        if (offset != null) {
            Ride.ExecutionDetails details = new Ride.ExecutionDetails();
            details.setEndTime(endTime);
            details.setEnvironmentalOffset(offset);
            ride.setExecutionDetails(details);
        }

        return rideRepository.save(ride);
    }

    private void saveRatingFor(String reviewedUserId) {
        Rating rating = new Rating();
        rating.setRideId("some-ride");
        rating.setReviewerId("some-reviewer");
        rating.setReviewedUserId(reviewedUserId);
        ratingRepository.save(rating);
    }

    // ---------- Security lockdown ----------

    @Test
    void adminEndpoints_shouldBeForbiddenForNonAdminUsers() throws Exception {
        saveUser("Passenger Pat", "pat@example.com", List.of("PASSENGER"), 80.0, 80.0, 80.0, 0.0);
        String token = loginAs("pat@example.com");

        mockMvc.perform(get("/api/admin/stats/overview")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminEndpoints_shouldBeForbiddenWhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/admin/stats/overview"))
                .andExpect(status().isForbidden());
    }

    // ---------- Overview stats ----------

    @Test
    void getOverviewStats_shouldAggregatePlatformMetrics() throws Exception {
        User admin = saveUser("Admin", "admin@example.com", List.of("ADMIN"), 80.0, 80.0, 80.0, 0.0);
        saveUser("Bob", "bob@example.com", List.of("DRIVER"), 80.0, 80.0, 80.0, 0.0);
        String token = loginAs(admin.getEmail());

        saveRide("Driver A", "ACTIVE", null, null);
        saveRide("Driver B", "ONGOING", null, null);
        saveRide("Driver C", "COMPLETED",
                new Ride.EnvironmentalOffset(10.0, 23.3), Instant.parse("2026-07-15T10:00:00Z"));

        RideRequest pending = new RideRequest();
        pending.setRideId("ride-1");
        pending.setPassengerId("passenger-1");
        pending.setStatus("PENDING");
        rideRequestRepository.save(pending);

        RideRequest approved = new RideRequest();
        approved.setRideId("ride-1");
        approved.setPassengerId("passenger-2");
        approved.setStatus("APPROVED");
        rideRequestRepository.save(approved);

        mockMvc.perform(get("/api/admin/stats/overview")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").value(2))
                .andExpect(jsonPath("$.data.totalRides").value(3))
                .andExpect(jsonPath("$.data.activeRides").value(1))
                .andExpect(jsonPath("$.data.completedRides").value(1))
                .andExpect(jsonPath("$.data.pendingRideRequests").value(1))
                .andExpect(jsonPath("$.data.averageUserRating").value(0.0))
                .andExpect(jsonPath("$.data.totalCo2SavedKg").value(23.3));
    }

    // ---------- User management ----------

    @SuppressWarnings("unchecked")
    @Test
    void getAllUsers_shouldReturnUsersWithoutPassword() throws Exception {
        User admin = saveUser("Admin", "admin@example.com", List.of("ADMIN"), 80.0, 80.0, 80.0, 0.0);
        saveUser("Charlie", "charlie@example.com", List.of("DRIVER", "PASSENGER"), 91.0, 85.0, 77.0, 12.5);
        String token = loginAs(admin.getEmail());

        MvcResult result = mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andReturn();

        Map<String, Object> response = new ObjectMapper()
                .readValue(result.getResponse().getContentAsString(), Map.class);
        List<Map<String, Object>> users = (List<Map<String, Object>>) response.get("data");
        Map<String, Object> charlie = users.stream()
                .filter(u -> "charlie@example.com".equals(u.get("email")))
                .findFirst()
                .orElseThrow();

        assertEquals("Charlie", charlie.get("name"));
        assertEquals(List.of("DRIVER", "PASSENGER"), charlie.get("roles"));
        assertEquals(91.0, charlie.get("trustScore"));
        assertEquals(85.0, charlie.get("reliabilityScore"));
        assertEquals(77.0, charlie.get("comfortScore"));
        assertEquals(12.5, charlie.get("totalCarbonSavedKg"));
        assertTrue(!charlie.containsKey("password"));
    }

    @Test
    void deleteUser_shouldRemoveNonAdminUser() throws Exception {
        User admin = saveUser("Admin", "admin@example.com", List.of("ADMIN"), 80.0, 80.0, 80.0, 0.0);
        User user = saveUser("Dana", "dana@example.com", List.of("PASSENGER"), 80.0, 80.0, 80.0, 0.0);
        String token = loginAs(admin.getEmail());

        mockMvc.perform(delete("/api/admin/users/" + user.getId())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertTrue(userRepository.findById(user.getId()).isEmpty());
    }

    @Test
    void deleteUser_shouldRejectDeletingAnAdminAccount() throws Exception {
        User admin = saveUser("Admin", "admin@example.com", List.of("ADMIN"), 80.0, 80.0, 80.0, 0.0);
        User otherAdmin = saveUser("Other Admin", "other-admin@example.com", List.of("ADMIN"),
                80.0, 80.0, 80.0, 0.0);
        String token = loginAs(admin.getEmail());

        mockMvc.perform(delete("/api/admin/users/" + otherAdmin.getId())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Cannot delete an admin account"));

        assertTrue(userRepository.findById(otherAdmin.getId()).isPresent());
    }

    @Test
    void deleteUser_shouldReturnUnauthorizedWhenUserDoesNotExist() throws Exception {
        User admin = saveUser("Admin", "admin@example.com", List.of("ADMIN"), 80.0, 80.0, 80.0, 0.0);
        String token = loginAs(admin.getEmail());

        mockMvc.perform(delete("/api/admin/users/does-not-exist")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ---------- Ride management ----------

    @Test
    void getAllRides_shouldReturnRideSummaries() throws Exception {
        User admin = saveUser("Admin", "admin@example.com", List.of("ADMIN"), 80.0, 80.0, 80.0, 0.0);
        String token = loginAs(admin.getEmail());
        saveRide("Erin", "ACTIVE", null, null);

        mockMvc.perform(get("/api/admin/rides")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].driverName").value("Erin"))
                .andExpect(jsonPath("$.data[0].sourceName").value("Source City"))
                .andExpect(jsonPath("$.data[0].destinationName").value("Destination City"))
                .andExpect(jsonPath("$.data[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.data[0].totalSeats").value(4))
                .andExpect(jsonPath("$.data[0].availableSeats").value(4));
    }

    @Test
    void deleteRide_shouldRemoveRide() throws Exception {
        User admin = saveUser("Admin", "admin@example.com", List.of("ADMIN"), 80.0, 80.0, 80.0, 0.0);
        String token = loginAs(admin.getEmail());
        Ride ride = saveRide("Frank", "ACTIVE", null, null);

        mockMvc.perform(delete("/api/admin/rides/" + ride.getId())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertTrue(rideRepository.findById(ride.getId()).isEmpty());
    }

    @Test
    void deleteRide_shouldReturnBadRequestWhenRideDoesNotExist() throws Exception {
        User admin = saveUser("Admin", "admin@example.com", List.of("ADMIN"), 80.0, 80.0, 80.0, 0.0);
        String token = loginAs(admin.getEmail());

        mockMvc.perform(delete("/api/admin/rides/does-not-exist")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ---------- Environmental analytics ----------

    @Test
    void getEnvironmentalAnalytics_shouldAggregateCompletedRidesOnly() throws Exception {
        User admin = saveUser("Admin", "admin@example.com", List.of("ADMIN"), 80.0, 80.0, 80.0, 0.0);
        String token = loginAs(admin.getEmail());

        Instant endTime = Instant.parse("2026-07-15T10:00:00Z");
        saveRide("Driver A", "COMPLETED", new Ride.EnvironmentalOffset(10.0, 23.3), endTime);
        saveRide("Driver B", "COMPLETED", new Ride.EnvironmentalOffset(20.0, 46.6), endTime);
        saveRide("Driver C", "ACTIVE", null, null);

        mockMvc.perform(get("/api/admin/analytics/environmental")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCo2SavedKg").value(69.9))
                .andExpect(jsonPath("$.data.totalFuelSavedLiters").value(30.0))
                .andExpect(jsonPath("$.data.sharedTrips").value(2))
                .andExpect(jsonPath("$.data.monthlyBreakdown", hasSize(1)))
                .andExpect(jsonPath("$.data.monthlyBreakdown[0].month").value("2026-07"))
                .andExpect(jsonPath("$.data.monthlyBreakdown[0].co2SavedKg").value(69.9))
                .andExpect(jsonPath("$.data.monthlyBreakdown[0].fuelSavedLiters").value(30.0))
                .andExpect(jsonPath("$.data.monthlyBreakdown[0].tripsCompleted").value(2));
    }

    // ---------- Reputation analytics ----------

    @Test
    void getReputationAnalytics_shouldRankAndFilterOnlyRatedUsers() throws Exception {
        User admin = saveUser("Admin", "admin@example.com", List.of("ADMIN"), 80.0, 80.0, 80.0, 0.0);
        String token = loginAs(admin.getEmail());

        User trustedDriver = saveUser("Trusted Driver", "trusted@example.com", List.of("DRIVER"),
                95.0, 90.0, 92.0, 0.0);
        User lowRatedUser = saveUser("Low Rated", "lowrated@example.com", List.of("PASSENGER"),
                40.0, 35.0, 30.0, 0.0);
        // Never rated: must be excluded from every list despite having a role/profile.
        saveUser("Unrated Driver", "unrated@example.com", List.of("DRIVER"), 80.0, 80.0, 80.0, 0.0);

        saveRatingFor(trustedDriver.getId());
        saveRatingFor(lowRatedUser.getId());

        mockMvc.perform(get("/api/admin/analytics/reputation")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.topTrustedDrivers", hasSize(1)))
                .andExpect(jsonPath("$.data.topTrustedDrivers[0].id").value(trustedDriver.getId()))
                .andExpect(jsonPath("$.data.lowestRatedUsers", hasSize(2)))
                .andExpect(jsonPath("$.data.lowestRatedUsers[0].id").value(lowRatedUser.getId()))
                .andExpect(jsonPath("$.data.lowestRatedUsers[1].id").value(trustedDriver.getId()))
                .andExpect(jsonPath("$.data.usersNeedingReview", hasSize(1)))
                .andExpect(jsonPath("$.data.usersNeedingReview[0].id").value(lowRatedUser.getId()))
                .andExpect(jsonPath("$.data.usersNeedingReview[0].overallScore").value(35.0));

        assertEquals(2, ratingRepository.count());
    }
}
