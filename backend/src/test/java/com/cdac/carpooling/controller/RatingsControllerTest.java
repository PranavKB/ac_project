package com.cdac.carpooling.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.repository.RatingRepository;
import com.cdac.carpooling.repository.RideRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class RatingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private RideRepository rideRepository;

    @BeforeEach
    void setUp() {
        ratingRepository.deleteAll();
        rideRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "passenger1", roles = { "PASSENGER" })
    void submitRating_shouldCreateRatingForExistingRide() throws Exception {

        Ride ride = new Ride();
        ride.setId("ride-100");
        ride.setDriverId("driver-1");
        ride.setDriverName("Alex");
        ride.setTotalSeats(4);
        ride.setAvailableSeats(4);
        ride.setStatus("ACTIVE");
        rideRepository.save(ride);

        String payload = """
                {
                  "rideId":"ride-100",
                  "reviewerId":"reviewer-1",
                  "reviewedUserId":"driver-1",
                  "textReview":"Great ride"
                }
                """;

        mockMvc.perform(post("/api/ratings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.rideId").value("ride-100"));

        assertEquals(1, ratingRepository.findByRideId("ride-100").size());
    }

    @Test
    @WithMockUser(username = "passenger1", roles = { "PASSENGER" })
    void getRideRatings_shouldReturnRatings() throws Exception {

        Ride ride = new Ride();
        ride.setId("ride-200");
        ride.setDriverId("driver-2");
        ride.setDriverName("Sam");
        ride.setStatus("ACTIVE");
        rideRepository.save(ride);

        String payload = """
                {
                  "rideId":"ride-200",
                  "reviewerId":"reviewer-2",
                  "reviewedUserId":"driver-2",
                  "textReview":"Very punctual"
                }
                """;

        mockMvc.perform(post("/api/ratings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/ratings/ride/ride-200"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].textReview")
                        .value("Very punctual"));
    }

    @Test
    @WithMockUser(username = "driver1", roles = { "DRIVER" })
    void submitRating_sameReviewerCanRateMultiplePassengersOnSameRide() throws Exception {
        Ride ride = new Ride();
        ride.setId("ride-300");
        ride.setDriverId("driver-3");
        ride.setStatus("COMPLETED");
        rideRepository.save(ride);

        String ratePassenger1 = """
                {
                  "rideId":"ride-300",
                  "reviewerId":"driver-3",
                  "reviewedUserId":"passenger-1",
                  "textReview":"Friendly"
                }
                """;
        mockMvc.perform(post("/api/ratings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(ratePassenger1))
                .andExpect(status().isCreated());

        String ratePassenger2 = """
                {
                  "rideId":"ride-300",
                  "reviewerId":"driver-3",
                  "reviewedUserId":"passenger-2",
                  "textReview":"On time"
                }
                """;
        mockMvc.perform(post("/api/ratings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(ratePassenger2))
                .andExpect(status().isCreated());

        assertEquals(2, ratingRepository.findByRideId("ride-300").size());

        // Rating the same passenger again for the same ride must still be blocked
        mockMvc.perform(post("/api/ratings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(ratePassenger1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You have already rated this user for this trip"));
    }
}
