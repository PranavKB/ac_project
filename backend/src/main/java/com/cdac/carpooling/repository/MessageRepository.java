package com.cdac.carpooling.repository;
import com.cdac.carpooling.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByRideIdOrderByTimestampAsc(String rideId);
}


