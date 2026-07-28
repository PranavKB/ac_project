package com.cdac.carpooling.service;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;

import com.cdac.carpooling.dto.AdminOverviewStatsDto;
import com.cdac.carpooling.dto.AdminReportDto;
import com.cdac.carpooling.dto.AdminRideSummaryDto;
import com.cdac.carpooling.dto.AdminUserDto;
import com.cdac.carpooling.dto.EnvironmentalAnalyticsDto;
import com.cdac.carpooling.dto.EnvironmentalAnalyticsDto.MonthlyBreakdown;
import com.cdac.carpooling.dto.ReputationAnalyticsDto;
import com.cdac.carpooling.dto.ReputationAnalyticsDto.ReputationEntry;
import com.cdac.carpooling.model.Report;
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.RatingRepository;
import com.cdac.carpooling.repository.ReportRepository;
import com.cdac.carpooling.repository.RideRepository;
import com.cdac.carpooling.repository.RideRequestRepository;
import com.cdac.carpooling.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final String MONTH_PATTERN = "yyyy-MM";
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern(MONTH_PATTERN)
            .withZone(ZoneOffset.UTC);
    private static final int TOP_LIST_LIMIT = 10;
    private static final double REVIEW_THRESHOLD = 60.0;

    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final RideRequestRepository rideRequestRepository;
    private final RatingRepository ratingRepository;
    private final ReportRepository reportRepository;

    // ---------- Overview ----------

    public AdminOverviewStatsDto getOverviewStats() {
        List<Ride> completedRides = rideRepository.findByStatus("COMPLETED");
        double totalCo2SavedKg = totalCo2FromRides(completedRides);

        List<RatedUser> ratedUsers = collectRatedUsers();
        double averageUserRating = ratedUsers.isEmpty() ? 0.0
                : ratedUsers.stream().mapToDouble(ru -> ru.overallScore).average().orElse(0.0);

        return AdminOverviewStatsDto.builder()
                .totalUsers(userRepository.count())
                .totalRides(rideRepository.count())
                .activeRides(rideRepository.countByStatus("ACTIVE"))
                .completedRides(completedRides.size())
                .pendingRideRequests(rideRequestRepository.countByStatus("PENDING"))
                .averageUserRating(round(averageUserRating))
                .totalCo2SavedKg(round(totalCo2SavedKg))
                .build();
    }

    // ---------- Users ----------

    public List<AdminUserDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::toAdminUserDto).toList();
    }

    public void deleteUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        if (user.getRoles() != null && user.getRoles().contains("ADMIN")) {
            throw new RuntimeException("Cannot delete an admin account");
        }
        userRepository.deleteById(id);
    }

    private AdminUserDto toAdminUserDto(User user) {
        User.ReputationProfile profile = user.getReputationProfile();
        return AdminUserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roles(user.getRoles())
                .createdAt(user.getCreatedAt())
                .trustScore(profile != null ? profile.getTrustScore() : 0.0)
                .reliabilityScore(profile != null ? profile.getReliabilityScore() : 0.0)
                .comfortScore(profile != null ? profile.getComfortScore() : 0.0)
                .totalCarbonSavedKg(user.getTotalCarbonSavedKg())
                .build();
    }

    // ---------- Rides ----------

    public List<AdminRideSummaryDto> getAllRides() {
        return rideRepository.findAll().stream().map(this::toAdminRideSummaryDto).toList();
    }

    public void deleteRide(String id) {
        if (!rideRepository.existsById(id)) {
            throw new RuntimeException("Ride not found with id: " + id);
        }
        rideRepository.deleteById(id);
    }

    private AdminRideSummaryDto toAdminRideSummaryDto(Ride ride) {
        return AdminRideSummaryDto.builder()
                .id(ride.getId())
                .driverName(ride.getDriverName())
                .sourceName(ride.getSource() != null ? ride.getSource().getName() : null)
                .destinationName(ride.getDestination() != null ? ride.getDestination().getName() : null)
                .departureTime(ride.getDepartureTime())
                .availableSeats(ride.getAvailableSeats())
                .totalSeats(ride.getTotalSeats())
                .status(ride.getStatus())
                .createdAt(ride.getCreatedAt())
                .build();
    }

    // ---------- Reports ----------

    public List<AdminReportDto> getAllReports() {
        return reportRepository.findAll().stream().map(this::toAdminReportDto).toList();
    }

    public void updateReportStatus(String id, String status) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found with id: " + id));
        report.setStatus(status);
        reportRepository.save(report);
    }

    private AdminReportDto toAdminReportDto(Report report) {
        Ride ride = report.getRideId() != null ? rideRepository.findById(report.getRideId()).orElse(null) : null;
        String rideSummary = ride != null
                ? "%s -> %s".formatted(
                        ride.getSource() != null ? ride.getSource().getName() : "Unknown",
                        ride.getDestination() != null ? ride.getDestination().getName() : "Unknown")
                : null;

        return AdminReportDto.builder()
                .id(report.getId())
                .rideId(report.getRideId())
                .rideSummary(rideSummary)
                .reporterId(report.getReporterId())
                .reporterName(userName(report.getReporterId()))
                .reportedUserId(report.getReportedUserId())
                .reportedUserName(userName(report.getReportedUserId()))
                .reason(report.getReason())
                .details(report.getDetails())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .build();
    }

    private String userName(String userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId).map(User::getName).orElse("Unknown user");
    }

    // ---------- Environmental analytics ----------

    public EnvironmentalAnalyticsDto getEnvironmentalAnalytics() {
        List<Ride> completedRides = rideRepository.findByStatus("COMPLETED");
        double totalCo2SavedKg = totalCo2FromRides(completedRides);

        Map<String, double[]> monthlyTotals = new TreeMap<>(); // month -> [co2Kg, tripsCompleted]
        for (Ride ride : completedRides) {
            Ride.EnvironmentalOffset offset = offsetOf(ride);
            if (offset == null || ride.getExecutionDetails().getEndTime() == null) {
                continue;
            }
            String month = MONTH_FORMATTER.format(ride.getExecutionDetails().getEndTime());
            double[] bucket = monthlyTotals.computeIfAbsent(month, m -> new double[2]);
            bucket[0] += offset.getNetReducedCo2Kg();
            bucket[1] += 1;
        }

        List<MonthlyBreakdown> monthlyBreakdown = new ArrayList<>();
        for (Map.Entry<String, double[]> entry : monthlyTotals.entrySet()) {
            double co2 = entry.getValue()[0];
            monthlyBreakdown.add(MonthlyBreakdown.builder()
                    .month(entry.getKey())
                    .co2SavedKg(round(co2))
                    .fuelSavedLiters(round(CarbonService.fuelLitersFromCo2Kg(co2)))
                    .tripsCompleted((long) entry.getValue()[1])
                    .build());
        }

        return EnvironmentalAnalyticsDto.builder()
                .totalCo2SavedKg(round(totalCo2SavedKg))
                .totalFuelSavedLiters(round(CarbonService.fuelLitersFromCo2Kg(totalCo2SavedKg)))
                .sharedTrips(completedRides.size())
                .monthlyBreakdown(monthlyBreakdown)
                .build();
    }

    private double totalCo2FromRides(List<Ride> completedRides) {
        return completedRides.stream()
                .map(this::offsetOf)
                .filter(offset -> offset != null)
                .mapToDouble(Ride.EnvironmentalOffset::getNetReducedCo2Kg)
                .sum();
    }

    private Ride.EnvironmentalOffset offsetOf(Ride ride) {
        return ride.getExecutionDetails() != null ? ride.getExecutionDetails().getEnvironmentalOffset() : null;
    }

    // ---------- Reputation analytics ----------

    public ReputationAnalyticsDto getReputationAnalytics() {
        List<RatedUser> ratedUsers = collectRatedUsers();

        List<ReputationEntry> topTrustedDrivers = ratedUsers.stream()
                .filter(ru -> ru.user.getRoles() != null && ru.user.getRoles().contains("DRIVER"))
                .sorted(Comparator.comparingDouble((RatedUser ru) -> ru.user.getReputationProfile().getTrustScore())
                        .reversed())
                .limit(TOP_LIST_LIMIT)
                .map(this::toReputationEntry)
                .toList();

        List<ReputationEntry> lowestRatedUsers = ratedUsers.stream()
                .sorted(Comparator.comparingDouble(ru -> ru.overallScore))
                .limit(TOP_LIST_LIMIT)
                .map(this::toReputationEntry)
                .toList();

        List<ReputationEntry> usersNeedingReview = ratedUsers.stream()
                .filter(ru -> ru.overallScore < REVIEW_THRESHOLD)
                .sorted(Comparator.comparingDouble(ru -> ru.overallScore))
                .map(this::toReputationEntry)
                .toList();

        return ReputationAnalyticsDto.builder()
                .topTrustedDrivers(topTrustedDrivers)
                .lowestRatedUsers(lowestRatedUsers)
                .usersNeedingReview(usersNeedingReview)
                .build();
    }

    private ReputationEntry toReputationEntry(RatedUser ratedUser) {
        User.ReputationProfile profile = ratedUser.user.getReputationProfile();
        return ReputationEntry.builder()
                .id(ratedUser.user.getId())
                .name(ratedUser.user.getName())
                .email(ratedUser.user.getEmail())
                .trustScore(profile.getTrustScore())
                .reliabilityScore(profile.getReliabilityScore())
                .comfortScore(profile.getComfortScore())
                .overallScore(round(ratedUser.overallScore))
                .ratingCount(ratedUser.ratingCount)
                .build();
    }

    private List<RatedUser> collectRatedUsers() {
        List<RatedUser> result = new ArrayList<>();
        for (User user : userRepository.findAll()) {
            User.ReputationProfile profile = user.getReputationProfile();
            long ratingCount = ratingRepository.countByReviewedUserId(user.getId());
            if (profile == null || ratingCount == 0) {
                continue;
            }
            double overallScore = (profile.getTrustScore() + profile.getReliabilityScore()
                    + profile.getComfortScore()) / 3.0;
            result.add(new RatedUser(user, ratingCount, overallScore));
        }
        return result;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private static class RatedUser {
        private final User user;
        private final long ratingCount;
        private final double overallScore;

        RatedUser(User user, long ratingCount, double overallScore) {
            this.user = user;
            this.ratingCount = ratingCount;
            this.overallScore = overallScore;
        }
    }
}
