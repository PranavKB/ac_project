package com.cdac.carpooling.repository;
import com.cdac.carpooling.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByRideIdOrderByTimestampAsc(String rideId);
    
}

