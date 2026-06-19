package com.cdac.carpooling.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.cdac.carpooling.model.Ride;


public interface RideRepository extends MongoRepository<Ride, String> {
}
