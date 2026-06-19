package com.cdac.carpooling.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.repository.RideRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // Uses application-test.properties
class RideControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RideRepository rideRepository;

    @BeforeEach
    void setUp() {
        // Clear your embedded MongoDB collections before each test run
        rideRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "admin", roles = {"USER", "ADMIN"})
    void testCreateRide_PersistsInEmbeddedMongo() throws Exception {
        String jsonPayload = """
                {
                    "driverId": "driver-777",
                    "driverName": "Sarah Jenkins",
                    "totalSeats": 4,
                    "departureTime": "2026-06-18T10:00:00Z",
                    "source": {
                        "name": "Alpha Office",
                        "location": {
                            "type": "Point",
                            "coordinates": [12.9716, 77.5946]
                        }
                    },
                    "destination": {
                        "name": "Beta Tech Park",
                        "location": {
                            "type": "Point",
                            "coordinates": [12.9279, 77.6413]
                        }
                    }
                }
                """;

        mockMvc.perform(post("/api/rides")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.driverId").value("driver-777"));

        List<Ride> savedRides = rideRepository.findAll();
        assertEquals(1, savedRides.size());
        assertEquals("Sarah Jenkins", savedRides.get(0).getDriverName());
    }

}
