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
@Document(collection = "reports")
public class Report {

    @Id
    private String id;

    private String rideId;
    private String reporterId;
    private String reportedUserId;

    private String reason;
    private String details;

    // PENDING, REVIEWED, DISMISSED
    private String status = "PENDING";

    private Instant createdAt = Instant.now();
}
