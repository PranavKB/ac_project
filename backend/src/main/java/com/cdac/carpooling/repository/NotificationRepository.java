package com.cdac.carpooling.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.cdac.carpooling.model.Notification;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserIdAndRead(String userId, boolean read);
}
