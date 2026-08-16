package com.cdac.carpooling.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "user1", roles = { "PASSENGER" })
    void updateUser_toleratesFullUserJsonWithNullPrimitiveFields() throws Exception {
        User user = new User();
        user.setName("Original Name");
        user.setEmail("original@example.com");
        user.setTotalCarbonSavedKg(4.5);
        user.setCreatedAt(Instant.now());
        User saved = userRepository.save(user);

        // PUTting back a full user object it previously fetched via
        // GET, where fields it doesn't intend to change (like the primitive carbon
        // total or reputation scores) are serialized as explicit JSON nulls.
        String payload = """
                {
                  "name": "Updated Name",
                  "phone": null,
                  "totalCarbonSavedKg": null,
                  "reputationProfile": null
                }
                """;

        mockMvc.perform(put("/api/users/" + saved.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Updated Name"));

        User updated = userRepository.findById(saved.getId()).orElseThrow();
        assertEquals("Updated Name", updated.getName());
        assertEquals(4.5, updated.getTotalCarbonSavedKg());
    }
}
