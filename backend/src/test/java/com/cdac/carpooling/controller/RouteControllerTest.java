package com.cdac.carpooling.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
public class RouteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "user1", roles = {"PASSENGER"})
    public void testGetRoute() throws Exception {
        // Bangalore to Electronic City coords
        double srcLat = 12.9716;
        double srcLng = 77.5946;
        double destLat = 12.85;
        double destLng = 77.66;

        mockMvc.perform(get("/api/route")
                .param("srcLat", String.valueOf(srcLat))
                .param("srcLng", String.valueOf(srcLng))
                .param("destLat", String.valueOf(destLat))
                .param("destLng", String.valueOf(destLng)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}
