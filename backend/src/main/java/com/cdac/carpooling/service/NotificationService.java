package com.cdac.carpooling.service;

import java.time.Instant;

import org.springframework.stereotype.Service;

import com.cdac.carpooling.model.Notification;
import com.cdac.carpooling.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void create(String userId, Notification.Type type, String title, String message, String relatedRideId) {
        if (userId == null) {
            return;
        }
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedRideId(relatedRideId);
        notification.setRead(false);
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
    }
}
