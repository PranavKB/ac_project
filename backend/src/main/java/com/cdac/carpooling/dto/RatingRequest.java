package com.cdac.carpooling.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RatingRequest {
    @NotBlank
    private String rideId;

    @NotBlank
    private String reviewerId;

    @NotBlank
    private String reviewedUserId;

    private String textReview;

    @Valid
    private MetricsDto metrics;

    @Data
    public static class MetricsDto {
        private Integer punctualityFactor = 5;
        private Integer cancellationConsistency = 5;
        private Integer safeDrivingAssessment = 5;
        private Integer rideCompletionSuccess = 5;
        private Integer uniformRoutineConsistency = 5;
        private Integer vehicleCleanlinessMetric = 5;
        private Integer communicationQualityFeedback = 5;
    }
}



