package com.cdac.carpooling.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportDto {
    private String id;
    private String rideId;
    private String rideSummary;
    private String reporterId;
    private String reporterName;
    private String reportedUserId;
    private String reportedUserName;
    private String reason;
    private String details;
    private String status;
    private Instant createdAt;
}
