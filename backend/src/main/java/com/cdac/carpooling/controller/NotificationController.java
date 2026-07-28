package com.cdac.carpooling.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.model.Notification;
import com.cdac.carpooling.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Notification>>> getByUser(@PathVariable String userId) {
        return ApiResponse.success(
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId),
                "Notifications fetched successfully");
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@PathVariable String userId) {
        return ApiResponse.success(
                notificationRepository.countByUserIdAndRead(userId, false),
                "Unread count fetched successfully");
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Object>> markRead(@PathVariable String id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
        notification.setRead(true);
        notificationRepository.save(notification);
        return ApiResponse.success(null, "Notification marked as read");
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<ApiResponse<Object>> markAllRead(@PathVariable String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
        return ApiResponse.success(null, "All notifications marked as read");
    }
}
