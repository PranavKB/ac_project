package com.cdac.carpooling.controller;

import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.dto.RatingRequest;
import com.cdac.carpooling.model.Rating;
import com.cdac.carpooling.repository.RatingRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingRepository ratingRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<Rating>> submitRating(@Valid @RequestBody RatingRequest request) {
        if (ratingRepository.existsByRideIdAndReviewerId(request.getRideId(), request.getReviewerId())) {
            return ApiResponse.error("You have already rated this trip", HttpStatus.BAD_REQUEST);
        }

        Rating rating = new Rating();
        rating.setRideId(request.getRideId());
        rating.setReviewerId(request.getReviewerId());
        rating.setReviewedUserId(request.getReviewedUserId());
        rating.setTextReview(request.getTextReview());
        rating.setCreatedAt(Instant.now());

        Rating.RatingMetrics metrics = new Rating.RatingMetrics();
        if (request.getMetrics() != null) {
            metrics.setPunctualityFactor(request.getMetrics().getPunctualityFactor());
            metrics.setCancellationConsistency(request.getMetrics().getCancellationConsistency());
            metrics.setSafeDrivingAssessment(request.getMetrics().getSafeDrivingAssessment());
            metrics.setRideCompletionSuccess(request.getMetrics().getRideCompletionSuccess());
            metrics.setUniformRoutineConsistency(request.getMetrics().getUniformRoutineConsistency());
            metrics.setVehicleCleanlinessMetric(request.getMetrics().getVehicleCleanlinessMetric());
            metrics.setCommunicationQualityFeedback(request.getMetrics().getCommunicationQualityFeedback());
        }
        rating.setMetrics(metrics);

        Rating saved = ratingRepository.save(rating);
        return ApiResponse.success(saved, "Rating submitted successfully", HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Rating>>> getUserRatings(@PathVariable String userId) {
        List<Rating> ratings = ratingRepository.findByReviewedUserId(userId);
        return ApiResponse.success(ratings, "User ratings fetched successfully");
    }

    @GetMapping("/ride/{rideId}")
    public ResponseEntity<ApiResponse<List<Rating>>> getRideRatings(@PathVariable String rideId) {
        List<Rating> ratings = ratingRepository.findByRideId(rideId);
        return ApiResponse.success(ratings, "Ride ratings fetched successfully");
    }
}



