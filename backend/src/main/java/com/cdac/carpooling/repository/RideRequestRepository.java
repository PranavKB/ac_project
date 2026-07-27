package com.cdac.carpooling.repository;

import com.cdac.carpooling.model.RideRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideRequestRepository extends MongoRepository<RideRequest, String> {
    List<RideRequest> findByRideId(String rideId);

    List<RideRequest> findByPassengerId(String passengerId);

    List<RideRequest> findByRideIdAndStatus(String rideId, String status);

    List<RideRequest> findByStatus(String status);

    long countByStatus(String status);
}
