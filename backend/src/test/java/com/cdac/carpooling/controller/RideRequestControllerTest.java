package com.cdac.carpooling.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.cdac.carpooling.repository.RideRequestRepository;
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
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RideRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RideRequestRepository rideRequestRepository;

    @BeforeEach
    void setUp() {
        rideRequestRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "passenger1", roles = { "PASSENGER" })
    void createRequest_shouldPersistAndReturnRequest() throws Exception {
        String payload = """
                {
                  "rideId": "ride-123",
                  "passengerId": "user-1",
                  "passengerName": "Alice",
                  "source": { "name": "A", "location": { "type": "Point", "coordinates": [77.0, 12.0] } },
                  "destination": { "name": "B", "location": { "type": "Point", "coordinates": [77.1, 12.1] } },
                  "passengerH3Segments": ["h3-1", "h3-2"]
                }
                """;

        mockMvc.perform(post("/api/ride-requests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.rideId").value("ride-123"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        assertEquals(1, rideRequestRepository.findByRideId("ride-123").size());
    }

    @Test
    @WithMockUser(username = "driver1", roles = { "DRIVER" })
    void approveRequest_shouldUpdateStatus() throws Exception {

        String payload = """
                { "rideId": "ride-123", "passengerId": "user-1", "passengerName": "Alice" }
                """;
        var mvcResult = mockMvc.perform(post("/api/ride-requests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)).andReturn();

        String responseContent = mvcResult.getResponse().getContentAsString();
        String id = responseContent.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(put("/api/ride-requests/" + id + "/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
    }
}