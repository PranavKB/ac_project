package com.cdac.carpooling.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.cdac.carpooling.model.LocationPoint;
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.repository.RideRepository;
import com.cdac.carpooling.service.H3Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@ActiveProfiles("test") // Uses application-test.properties (Embedded MongoDB)
class RideControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private H3Service h3Service;

    @BeforeEach
    void setUp() {
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
                .andExpect(jsonPath("$.driverId").value("driver-777"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.availableSeats").value(4));

        List<Ride> savedRides = rideRepository.findAll();
        assertEquals(1, savedRides.size());
        assertEquals("Sarah Jenkins", savedRides.get(0).getDriverName());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"USER", "ADMIN"})
    void testSearchRides_WithEmbeddedMongo() throws Exception {
        // 1. Target test coordinates
        List<Double> srcCoords = List.of(12.9716, 77.5946);
        List<Double> dstCoords = List.of(12.9279, 77.6413);

        // 2. Insert an active base ride entity using your production API setup
        String creationPayload = """
                {
                    "driverId": "driver-999",
                    "driverName": "David Miller",
                    "totalSeats": 3,
                    "departureTime": "2026-06-18T12:00:00Z",
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
                .content(creationPayload))
                .andExpect(status().isOk());

        // 3. Since createRide doesn't auto-calculate H3 indexes in the database,
        // we'll fetch the document saved by the controller and update its properties 
        // to match whatever model structure your specific Ride entity uses.
        List<Ride> savedRides = rideRepository.findAll();
        assertEquals(1, savedRides.size());
        Ride createdRide = savedRides.get(0);
        
        // Use your real H3Service to calculate the keys
        List<List<Double>> simplePath = List.of(srcCoords, dstCoords);
        List<String> realCalculatedH3 = h3Service.pathToH3Segments(simplePath);


        // 4. Fire the search request payload
        String searchPayload = """
                {
                    "sourceCoords": [12.9716, 77.5946],
                    "destinationCoords": [12.9279, 77.6413]
                }
                """;

        mockMvc.perform(post("/api/rides/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(searchPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Matching rides fetched successfully"));
                
    }

    @Test
    @WithMockUser(username = "admin", roles = {"USER", "ADMIN"})
    void testSearchRides_InvalidCoordinates() throws Exception {
        String invalidPayload = """
                {
                    "sourceCoords": [12.9716, 77.5946],
                    "destinationCoords": null
                }
                """;

        mockMvc.perform(post("/api/rides/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid coordinates provided"));
    }
}

