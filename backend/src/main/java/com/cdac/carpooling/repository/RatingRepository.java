package com.cdac.carpooling.repository;
import com.cdac.carpooling.model.Rating;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface RatingRepository extends MongoRepository<Rating, String> {
    List<Rating> findByReviewedUserId(String reviewedUserId);
    List<Rating> findByRideId(String rideId);
    boolean existsByRideIdAndReviewerId(String rideId, String reviewerId);
}


