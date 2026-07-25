package com.cdac.carpooling.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class JwtAuthenticationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private UserRepository userRepository;

        @BeforeEach
        void setUp() {
                userRepository.deleteAll();
        }

        @SuppressWarnings("unchecked")
        @Test
        void testJwtAuthenticationFlow() throws Exception {
                // 1. Request protected endpoint /api/hello without credentials
                // should be Forbidden (403)
                mockMvc.perform(get("/api/hello"))
                                .andExpect(status().isForbidden());

                // 2. Register a user
                String registerPayload = """
                                {
                                    "name": "John Doe",
                                    "email": "john@example.com",
                                    "phone": "1234567890",
                                    "password": "securepassword",
                                    "roles": ["PASSENGER"]
                                }
                                """;

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(registerPayload))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("User registered successfully. A confirmation email has been sent."));

                // 3. Login with registered credentials
                // should return JWT token
                String loginPayload = """
                                {
                                    "email": "john@example.com",
                                    "password": "securepassword"
                                }
                                """;

                MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(loginPayload))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.token").exists())
                                .andExpect(jsonPath("$.data.user.email").value("john@example.com"))
                                .andReturn();

                // Extract token from response
                String responseContent = loginResult.getResponse().getContentAsString();
                ObjectMapper objectMapper = new ObjectMapper();
                Map<String, Object> responseMap = objectMapper.readValue(responseContent, Map.class);
                Map<String, Object> dataMap = (Map<String, Object>) responseMap.get("data");
                String token = (String) dataMap.get("token");

                // 4. Request protected endpoint /api/hello with valid token
                // should be successful (200 OK)
                mockMvc.perform(get("/api/hello")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(content().string("Hello, World!"));

                // 5. Request protected endpoint with invalid token
                // should be unauthorized (401)
                mockMvc.perform(get("/api/hello")
                                .header("Authorization", "Bearer invalidtoken123"))
                                .andExpect(status().isUnauthorized());
        }
}
