package com.cdac.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOverviewStatsDto {
    private long totalUsers;
    private long totalRides;
    private long activeRides;
    private long completedRides;
    private long pendingRideRequests;
    private double averageUserRating;
    private double totalCo2SavedKg;
}
