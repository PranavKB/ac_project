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

    private String bio;
    private Preferences preferences;
    private VehicleDetails vehicleDetails;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReputationProfile {
        private double trustScore = 80.0;
        private double reliabilityScore = 80.0;
        private double comfortScore = 80.0;
        private String aiSummary = "New user. No rides yet.";
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Preferences {
        private String chattiness;
        private String music;
        private String smoking;
        private String pets;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleDetails {
        private String model;
        private String color;
        private String plateNumber;
    }
}
