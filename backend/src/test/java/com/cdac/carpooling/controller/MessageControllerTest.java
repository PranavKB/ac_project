package com.cdac.carpooling.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cdac.carpooling.repository.MessageRepository;
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
class MessageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MessageRepository messageRepository;

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "passenger1", roles = { "PASSENGER" })
    void sendMessage_shouldPersistAndReturnMessage() throws Exception {

        String payload = """
                {
                  "rideId":"ride-300",
                  "senderId":"sender-1",
                  "senderName":"Nina",
                  "messageText":"Hello there"
                }
                """;

        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rideId").value("ride-300"))
                .andExpect(jsonPath("$.senderId").value("sender-1"))
                .andExpect(jsonPath("$.messageText").value("Hello there"));

        assertEquals(
                1,
                messageRepository.findByRideIdOrderByTimestampAsc("ride-300").size());
    }

    @Test
    @WithMockUser(username = "passenger1", roles = { "PASSENGER" })
    void getRideMessages_shouldReturnMessagesForRide() throws Exception {

        String payload = """
                {
                  "rideId":"ride-400",
                  "senderId":"sender-2",
                  "senderName":"Omar",
                  "messageText":"Pickup at the station"
                }
                """;

        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/messages/ride/ride-400"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].messageText")
                        .value("Pickup at the station"));
    }
}
