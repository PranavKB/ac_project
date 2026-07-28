package com.cdac.carpooling.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.cdac.carpooling.model.Rating;
import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.RatingRepository;
import com.cdac.carpooling.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReputationService {

    // Metrics are scored 1-5; scaling by 20 maps that to a 20-100 range,
    // keeping continuity with the 80.0 "new user" default (≈ a 4/5 average).
    private static final double METRIC_TO_SCORE_SCALE = 20.0;

    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;

    public void recalculate(String reviewedUserId) {
        List<Rating> ratings = ratingRepository.findByReviewedUserId(reviewedUserId);
        if (ratings.isEmpty()) {
            return;
        }

        double trustScore = weightedAverage(ratings, m -> 0.4 * m.getPunctualityFactor()
                + 0.3 * m.getCancellationConsistency()
                + 0.3 * m.getSafeDrivingAssessment());

        double reliabilityScore = weightedAverage(ratings, m -> 0.5 * m.getRideCompletionSuccess()
                + 0.3 * m.getPunctualityFactor()
                + 0.2 * m.getUniformRoutineConsistency());

        double comfortScore = weightedAverage(ratings, m -> 0.6 * m.getVehicleCleanlinessMetric()
                + 0.4 * m.getCommunicationQualityFeedback());

        String aiSummary = buildSummary((trustScore + reliabilityScore + comfortScore) / 3.0);

        userRepository.findById(reviewedUserId).ifPresent(user -> {
            user.setReputationProfile(new User.ReputationProfile(
                    round(trustScore), round(reliabilityScore), round(comfortScore), aiSummary));
            userRepository.save(user);
        });
    }

    private double weightedAverage(List<Rating> ratings,
            java.util.function.ToDoubleFunction<Rating.RatingMetrics> scorer) {
        return ratings.stream()
                .mapToDouble(r -> scorer.applyAsDouble(r.getMetrics()))
                .average()
                .orElse(0.0) * METRIC_TO_SCORE_SCALE;
    }

    private String buildSummary(double overallScore) {
        if (overallScore >= 90) {
            return "Excellent reputation — highly trusted and reliable.";
        }
        if (overallScore >= 75) {
            return "Good standing with the community.";
        }
        if (overallScore >= 60) {
            return "Average standing — some room to improve.";
        }
        return "Below average — flagged for review.";
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
