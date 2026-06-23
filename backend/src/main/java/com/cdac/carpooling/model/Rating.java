package com.cdac.carpooling.model;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ratings")
public class Rating {
    @Id
    private String id;

    private String rideId;
    private String reviewerId;
    private String reviewedUserId;

    private RatingMetrics metrics;
    private String textReview;
    private Instant createdAt = Instant.now();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RatingMetrics {
        // Trust (40% weight on trustScore)
        private int punctualityFactor;        // 1-5
        private int cancellationConsistency;  // 1-5
        private int safeDrivingAssessment;    // 1-5

        // Reliability (30% weight)
        private int rideCompletionSuccess;    // 1-5
        private int uniformRoutineConsistency;// 1-5

        // Comfort (30% weight)
        private int vehicleCleanlinessMetric; // 1-5
        private int communicationQualityFeedback; // 1-5
    }
}









