package com.cdac.carpooling.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cdac.carpooling.repository.UserRepository;
import com.cdac.carpooling.security.JwtUtil;
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

    @Autowired
    private JwtUtil jwtUtil;

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

    private void registerTestUser(String email, String password) throws Exception {
        String payload = """
                {
                  "name": "Reset Test User",
                  "email": "%s",
                  "phone": "9876543210",
                  "password": "%s",
                  "roles": ["PASSENGER"]
                }
                """.formatted(email, password);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    void forgotPassword_shouldSucceedForRegisteredEmail() throws Exception {
        registerTestUser("reset1@example.com", "originalPass123");

        String payload = """
                { "email": "reset1@example.com" }
                """;

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Password reset link sent to your email. Please check your inbox."));
    }

    @Test
    void forgotPassword_shouldFailForUnregisteredEmail() throws Exception {
        String payload = """
                { "email": "nobody@example.com" }
                """;

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void verifyResetToken_shouldSucceedForValidToken() throws Exception {
        registerTestUser("reset2@example.com", "originalPass123");
        String token = jwtUtil.generatePasswordResetToken("reset2@example.com");

        mockMvc.perform(get("/api/auth/verify-reset-token").param("token", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("reset2@example.com"));
    }

    @Test
    void verifyResetToken_shouldRejectARegistrationToken() throws Exception {
        // A registration token must not double as a password reset token, and vice versa.
        String registrationToken = jwtUtil.generateRegistrationToken("reset3@example.com");

        mockMvc.perform(get("/api/auth/verify-reset-token").param("token", registrationToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void resetPassword_shouldUpdatePasswordAndAllowLoginWithNewPassword() throws Exception {
        registerTestUser("reset4@example.com", "originalPass123");
        String token = jwtUtil.generatePasswordResetToken("reset4@example.com");

        String resetPayload = """
                { "token": "%s", "newPassword": "brandNewPass456" }
                """.formatted(token);

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(resetPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Old password must no longer work
        String oldLoginPayload = """
                { "email": "reset4@example.com", "password": "originalPass123" }
                """;
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(oldLoginPayload))
                .andExpect(jsonPath("$.success").value(false));

        // New password must work
        String newLoginPayload = """
                { "email": "reset4@example.com", "password": "brandNewPass456" }
                """;
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(newLoginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value(notNullValue()));
    }

    @Test
    void resetPassword_shouldFailForInvalidToken() throws Exception {
        String resetPayload = """
                { "token": "not-a-real-token", "newPassword": "brandNewPass456" }
                """;

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(resetPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
