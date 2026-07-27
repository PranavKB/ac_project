package com.cdac.carpooling.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReputationAnalyticsDto {
    private List<ReputationEntry> topTrustedDrivers;
    private List<ReputationEntry> lowestRatedUsers;
    private List<ReputationEntry> usersNeedingReview;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReputationEntry {
        private String id;
        private String name;
        private String email;
        private double trustScore;
        private double reliabilityScore;
        private double comfortScore;
        private double overallScore;
        private long ratingCount;
    }
}
