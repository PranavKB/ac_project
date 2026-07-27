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

        double trustScore = average(ratings, r -> List.of(
                r.getMetrics().getPunctualityFactor(),
                r.getMetrics().getCancellationConsistency(),
                r.getMetrics().getSafeDrivingAssessment()));

        double reliabilityScore = average(ratings, r -> List.of(
                r.getMetrics().getRideCompletionSuccess(),
                r.getMetrics().getUniformRoutineConsistency()));

        double comfortScore = average(ratings, r -> List.of(
                r.getMetrics().getVehicleCleanlinessMetric(),
                r.getMetrics().getCommunicationQualityFeedback()));

        String aiSummary = buildSummary((trustScore + reliabilityScore + comfortScore) / 3.0);

        userRepository.findById(reviewedUserId).ifPresent(user -> {
            user.setReputationProfile(new User.ReputationProfile(
                    round(trustScore), round(reliabilityScore), round(comfortScore), aiSummary));
            userRepository.save(user);
        });
    }

    private double average(List<Rating> ratings, java.util.function.Function<Rating, List<Integer>> metricSelector) {
        return ratings.stream()
                .flatMap(r -> metricSelector.apply(r).stream())
                .mapToInt(Integer::intValue)
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
