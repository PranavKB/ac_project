package com.cdac.carpooling.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.cdac.carpooling.model.LocationPoint;
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.repository.RideRepository;
import com.cdac.carpooling.service.H3Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

@SpringBootTest
@AutoConfigureMockMvc 
                                                                         
@ActiveProfiles("test") 
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
   @WithMockUser(username = "driver1", roles = {"DRIVER"})
    void testCreateRide() throws Exception {

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
                .andExpect(jsonPath("$.message").value("Ride created Successfully"))
                .andExpect(jsonPath("$.data.driverId").value("driver-777"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.availableSeats").value(4));

        List<Ride> savedRides = rideRepository.findAll();
        assertEquals(1, savedRides.size());

        Ride savedRide = savedRides.get(0);
        assertEquals("Sarah Jenkins", savedRide.getDriverName());
        assertEquals(4, savedRide.getAvailableSeats());
        assertEquals("ACTIVE", savedRide.getStatus());

        assertEquals(List.of(12.9716, 77.5946), savedRide.getCurrentLocation());
        assertNotNull(savedRide.getH3RouteSegments());
    }

    @Test
    @WithMockUser(username = "passenger1", roles = {"PASSENGER"})
    void testSearchRides() throws Exception {

        List<Double> srcCoords = List.of(12.9716, 77.5946);
        List<Double> dstCoords = List.of(12.9279, 77.6413);

        List<List<Double>> simplePath = List.of(srcCoords, dstCoords);
        List<String> realCalculatedH3 = h3Service.pathToH3Segments(simplePath);

        Ride expectedRide = new Ride();
        expectedRide.setDriverId("driver-999");
        expectedRide.setDriverName("David Miller");
        expectedRide.setTotalSeats(3);
        expectedRide.setAvailableSeats(3);
        expectedRide.setStatus("ACTIVE");
        expectedRide.setDepartureTime(Instant.now().plusSeconds(3600));


        expectedRide.setH3RouteSegments(realCalculatedH3);

        LocationPoint srcPoint = new LocationPoint();
        srcPoint.setName("Alpha Office");
        LocationPoint.GeoJsonPoint srcGeo = new LocationPoint.GeoJsonPoint();
        srcGeo.setType("Point");
        srcGeo.setCoordinates(new double[] { srcCoords.get(0), srcCoords.get(1) });
        srcPoint.setLocation(srcGeo);
        expectedRide.setSource(srcPoint);

        LocationPoint dstPoint = new LocationPoint();
        dstPoint.setName("Beta Tech Park");
        LocationPoint.GeoJsonPoint dstGeo = new LocationPoint.GeoJsonPoint();
        dstGeo.setType("Point");
        dstGeo.setCoordinates(new double[] { dstCoords.get(0), dstCoords.get(1) });
        dstPoint.setLocation(dstGeo);
        expectedRide.setDestination(dstPoint);

        rideRepository.save(expectedRide);

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
                .andExpect(jsonPath("$.message").value("Matching rides fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].ride.driverId").value("driver-999"))
                .andExpect(jsonPath("$.data[0].ride.driverName").value("David Miller"));
    }

    @Test
    @WithMockUser(username = "passenger1", roles = {"PASSENGER"})
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
