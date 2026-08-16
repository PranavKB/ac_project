package com.cdac.carpooling.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.cdac.carpooling.model.Ride;

public interface RideRepository extends MongoRepository<Ride, String> {
    List<Ride> findByStatus(String status);

    List<Ride> findByStatusIn(List<String> statuses);

    List<Ride> findByDepartureTimeBetweenAndStatusIn(java.time.Instant start, java.time.Instant end, List<String> statuses);

    List<Ride> findByDriverId(String driverId);

    long countByStatus(String status);

    boolean existsByDriverIdAndDepartureTimeAndStatusIn(String driverId, java.time.Instant departureTime,
            List<String> statuses);
}
