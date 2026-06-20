package com.cdac.carpooling.model;


import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String phone;
    private String password;

    private List<String> roles; // DRIVER, PASSENGER

    private ReputationProfile reputationProfile;

    private double totalCarbonSavedKg = 0.0;

    private Instant createdAt = Instant.now();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReputationProfile {
        private double trustScore = 80.0;
        private double reliabilityScore = 80.0;
        private double comfortScore = 80.0;
        private String aiSummary = "New user. No rides yet.";
    }
}
