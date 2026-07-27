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
public class AdminRideSummaryDto {
    private String id;
    private String driverName;
    private String sourceName;
    private String destinationName;
    private Instant departureTime;
    private int availableSeats;
    private int totalSeats;
    private String status;
    private Instant createdAt;
}
