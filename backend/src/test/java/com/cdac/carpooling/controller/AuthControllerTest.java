package com.cdac.carpooling.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cdac.carpooling.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void register_shouldSucceedWithValidRequest() throws Exception {
        String payload = """
                {
                  "name": "Jane Doe",
                  "email": "jane@example.com",
                  "phone": "9876543210",
                  "password": "securePassword",
                  "roles": ["PASSENGER"]
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("jane@example.com"))
                .andExpect(jsonPath("$.message").value("User registered successfully. A confirmation email has been sent."));

        assertEquals(1, userRepository.count());
    }

    @Test
    void register_shouldFailValidationWithInvalidRequest() throws Exception {
        String payload = """
                {
                  "name": null,
                  "email": "invalid-email",
                  "phone": "123",
                  "password": "123",
                  "roles": ["PASSENGER"]
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.name").value("Name is required"))
                .andExpect(jsonPath("$.errors.email").value("Please provide a valid email address"))
                .andExpect(jsonPath("$.errors.phone").value("Phone number must be exactly 10 digits"))
                .andExpect(jsonPath("$.errors.password").value("Password must be at least 6 characters long"));
    }

    @Test
    void login_shouldSucceedWithCorrectCredentials() throws Exception {
        // Register a user first
        String registerPayload = """
                {
                  "name": "John Doe",
                  "email": "john@example.com",
                  "phone": "9876543210",
                  "password": "mypassword123",
                  "roles": ["PASSENGER"]
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerPayload))
                .andExpect(status().isOk());

        // Perform login
        String loginPayload = """
                {
                  "email": "john@example.com",
                  "password": "mypassword123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value(notNullValue()))
                .andExpect(jsonPath("$.data.user.email").value("john@example.com"));
    }

    @Test
    void login_shouldFailValidationWithInvalidEmail() throws Exception {
        String loginPayload = """
                {
                  "email": "notanemail",
                  "password": "pass"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.email").value("Please provide a valid email address"));
    }
}
