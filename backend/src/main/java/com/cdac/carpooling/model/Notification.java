package com.cdac.carpooling.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String userId;

    private Type type;

    private String title;
    private String message;
    private String relatedRideId;

    private boolean read = false;

    private Instant createdAt = Instant.now();

    public enum Type {
        BOOKING_REQUESTED,
        REQUEST_APPROVED,
        REQUEST_REJECTED,
        RIDE_STARTED,
        RIDE_COMPLETED,
        RIDE_CANCELLED,
        BACKUP_CANDIDATE_SUGGESTED
    }
}
