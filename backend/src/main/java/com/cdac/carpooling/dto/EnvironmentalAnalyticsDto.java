package com.cdac.carpooling.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvironmentalAnalyticsDto {
    private double totalCo2SavedKg;
    private double totalFuelSavedLiters;
    private long sharedTrips;
    private List<MonthlyBreakdown> monthlyBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyBreakdown {
        // e.g. "2026-07"
        private String month;
        private double co2SavedKg;
        private double fuelSavedLiters;
        private long tripsCompleted;
    }
}
