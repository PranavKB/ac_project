package com.cdac.carpooling.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.cdac.carpooling.model.LocationPoint;
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.RideRepository;
import com.cdac.carpooling.repository.RideRequestRepository;
import com.cdac.carpooling.repository.UserRepository;
import com.cdac.carpooling.service.H3Service;
import com.cdac.carpooling.service.RoutingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.test.web.servlet.MvcResult;
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
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class RideControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RideRequestRepository rideRequestRepository;

    @Autowired
    private H3Service h3Service;

    @Autowired
    private RoutingService routingService;

    @BeforeEach
    void setUp() {
        rideRepository.deleteAll();
        userRepository.deleteAll();
        rideRequestRepository.deleteAll();
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
                            "coordinates": [77.5946, 12.9716]
                        }
                    },
                    "destination": {
                        "name": "Beta Tech Park",
                        "location": {
                            "type": "Point",
                            "coordinates": [77.6413, 12.9279]
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

        assertEquals(List.of(77.5946, 12.9716), savedRide.getCurrentLocation());
        assertNotNull(savedRide.getH3RouteSegments());
    }

    @Test
    @WithMockUser(username = "passenger1", roles = {"PASSENGER"})
    void testSearchRides() throws Exception {

        List<Double> srcCoords = List.of(12.9716, 77.5946);
        List<Double> dstCoords = List.of(12.9279, 77.6413);

        List<List<Double>> routeCoords = routingService.getRouteCoordinates(srcCoords.get(0), srcCoords.get(1), dstCoords.get(0), dstCoords.get(1));
        List<String> realCalculatedH3 = h3Service.pathToH3Segments(routeCoords);

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
        // GeoJSON order: [longitude, latitude]
        srcGeo.setCoordinates(new double[] { srcCoords.get(1), srcCoords.get(0) });
        srcPoint.setLocation(srcGeo);
        expectedRide.setSource(srcPoint);

        LocationPoint dstPoint = new LocationPoint();
        dstPoint.setName("Beta Tech Park");
        LocationPoint.GeoJsonPoint dstGeo = new LocationPoint.GeoJsonPoint();
        dstGeo.setType("Point");
        // GeoJSON order: [longitude, latitude]
        dstGeo.setCoordinates(new double[] { dstCoords.get(1), dstCoords.get(0) });
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

    @Test
    @WithMockUser(username = "driver1", roles = {"DRIVER"})
    void testCompleteRide_shouldPruneH3Segments() throws Exception {
        Ride ride = new Ride();
        ride.setDriverId("driver-777");
        ride.setStatus("ACTIVE");
        ride.setH3RouteSegments(List.of("h3_1", "h3_2", "h3_3", "h3_4"));
        Ride.ExecutionDetails details = new Ride.ExecutionDetails();
        details.setStartTime(Instant.now());
        ride.setExecutionDetails(details);

        Ride savedRide = rideRepository.save(ride);

        mockMvc.perform(post("/api/rides/" + savedRide.getId() + "/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Ride completed successfully"));

        Ride completedRide = rideRepository.findById(savedRide.getId()).orElse(null);
        assertNotNull(completedRide);
        assertEquals("COMPLETED", completedRide.getStatus());
        assertEquals(2, completedRide.getH3RouteSegments().size());
        assertEquals("h3_1", completedRide.getH3RouteSegments().get(0));
        assertEquals("h3_4", completedRide.getH3RouteSegments().get(1));
    }

    @Test
    @WithMockUser(username = "driver1", roles = {"DRIVER"})
    void testCompleteRide_creditsCarbonToAllPassengers() throws Exception {
        User passenger1 = new User();
        passenger1.setName("Passenger One");
        passenger1.setEmail("p1@example.com");
        passenger1.setTotalCarbonSavedKg(0.0);
        passenger1 = userRepository.save(passenger1);

        User passenger2 = new User();
        passenger2.setName("Passenger Two");
        passenger2.setEmail("p2@example.com");
        passenger2.setTotalCarbonSavedKg(0.0);
        passenger2 = userRepository.save(passenger2);

        Ride ride = new Ride();
        ride.setDriverId("driver-777");
        ride.setStatus("ONGOING");
        ride.setPassengerIds(List.of(passenger1.getId(), passenger2.getId()));
        ride.setH3RouteSegments(List.of("h3_1", "h3_2"));
        Ride.ExecutionDetails details = new Ride.ExecutionDetails();
        details.setStartTime(Instant.now());
        ride.setExecutionDetails(details);

        Ride savedRide = rideRepository.save(ride);

        mockMvc.perform(post("/api/rides/" + savedRide.getId() + "/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"actualDistanceKm\": 10.0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        User updatedP1 = userRepository.findById(passenger1.getId()).orElseThrow();
        User updatedP2 = userRepository.findById(passenger2.getId()).orElseThrow();

        assertEquals(1.86, updatedP1.getTotalCarbonSavedKg());
        assertEquals(1.86, updatedP2.getTotalCarbonSavedKg());
    }

    @Test
    @WithMockUser(username = "driver1", roles = { "DRIVER" })
    void testFullFlow_requestThenApproveThenComplete_creditsAllPassengers() throws Exception {
        User passenger1 = new User();
        passenger1.setName("Passenger One");
        passenger1.setEmail("full-p1@example.com");
        passenger1.setTotalCarbonSavedKg(0.0);
        passenger1 = userRepository.save(passenger1);

        User passenger2 = new User();
        passenger2.setName("Passenger Two");
        passenger2.setEmail("full-p2@example.com");
        passenger2.setTotalCarbonSavedKg(0.0);
        passenger2 = userRepository.save(passenger2);

        Ride ride = new Ride();
        ride.setDriverId("driver-777");
        ride.setStatus("ACTIVE");
        ride.setTotalSeats(2);
        ride.setAvailableSeats(2);
        ride.setH3RouteSegments(List.of("h3_1", "h3_2"));
        Ride savedRide = rideRepository.save(ride);

        ObjectMapper mapper = new ObjectMapper();
        String locationJson = """
                {
                  "name": "Somewhere",
                  "location": { "type": "Point", "coordinates": [77.59, 12.97] }
                }
                """;
        JsonNode location = mapper.readTree(locationJson);

        for (User passenger : List.of(passenger1, passenger2)) {
            String requestPayload = mapper.createObjectNode()
                    .put("rideId", savedRide.getId())
                    .put("passengerId", passenger.getId())
                    .put("passengerName", passenger.getName())
                    .<com.fasterxml.jackson.databind.node.ObjectNode>set("source", location)
                    .<com.fasterxml.jackson.databind.node.ObjectNode>set("destination", location)
                    .toString();

            MvcResult result = mockMvc.perform(post("/api/requests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestPayload))
                    .andExpect(status().isOk())
                    .andReturn();

            String requestId = mapper.readTree(result.getResponse().getContentAsString())
                    .path("data").path("id").asText();

            mockMvc.perform(put("/api/requests/" + requestId + "/approve"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        Ride rideAfterApprovals = rideRepository.findById(savedRide.getId()).orElseThrow();
        assertEquals(0, rideAfterApprovals.getAvailableSeats());
        assertTrue(rideAfterApprovals.getPassengerIds().contains(passenger1.getId()));
        assertTrue(rideAfterApprovals.getPassengerIds().contains(passenger2.getId()));
        assertEquals(2, rideAfterApprovals.getPassengerIds().size());

        Ride.ExecutionDetails details = new Ride.ExecutionDetails();
        details.setStartTime(Instant.now());
        rideAfterApprovals.setExecutionDetails(details);
        rideAfterApprovals.setStatus("ONGOING");
        rideRepository.save(rideAfterApprovals);

        mockMvc.perform(post("/api/rides/" + savedRide.getId() + "/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"actualDistanceKm\": 10.0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        User updatedP1 = userRepository.findById(passenger1.getId()).orElseThrow();
        User updatedP2 = userRepository.findById(passenger2.getId()).orElseThrow();

        assertEquals(1.86, updatedP1.getTotalCarbonSavedKg());
        assertEquals(1.86, updatedP2.getTotalCarbonSavedKg());
    }
}
