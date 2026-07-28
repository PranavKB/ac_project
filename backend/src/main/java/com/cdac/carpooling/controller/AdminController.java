package com.cdac.carpooling.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cdac.carpooling.dto.AdminOverviewStatsDto;
import com.cdac.carpooling.dto.AdminReportDto;
import com.cdac.carpooling.dto.AdminRideSummaryDto;
import com.cdac.carpooling.dto.AdminUserDto;
import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.dto.EnvironmentalAnalyticsDto;
import com.cdac.carpooling.dto.ReputationAnalyticsDto;
import com.cdac.carpooling.service.AdminService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats/overview")
    public ResponseEntity<ApiResponse<AdminOverviewStatsDto>> getOverviewStats() {
        return ApiResponse.success(adminService.getOverviewStats(), "Overview stats fetched successfully");
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminUserDto>>> getAllUsers() {
        return ApiResponse.success(adminService.getAllUsers(), "Users fetched successfully");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteUser(@PathVariable String id) {
        adminService.deleteUser(id);
        return ApiResponse.success(null, "User deleted successfully");
    }

    @GetMapping("/rides")
    public ResponseEntity<ApiResponse<List<AdminRideSummaryDto>>> getAllRides() {
        return ApiResponse.success(adminService.getAllRides(), "Rides fetched successfully");
    }

    @DeleteMapping("/rides/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteRide(@PathVariable String id) {
        adminService.deleteRide(id);
        return ApiResponse.success(null, "Ride deleted successfully");
    }

    @GetMapping("/analytics/environmental")
    public ResponseEntity<ApiResponse<EnvironmentalAnalyticsDto>> getEnvironmentalAnalytics() {
        return ApiResponse.success(adminService.getEnvironmentalAnalytics(), "Environmental analytics fetched successfully");
    }

    @GetMapping("/analytics/reputation")
    public ResponseEntity<ApiResponse<ReputationAnalyticsDto>> getReputationAnalytics() {
        return ApiResponse.success(adminService.getReputationAnalytics(), "Reputation analytics fetched successfully");
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<AdminReportDto>>> getAllReports() {
        return ApiResponse.success(adminService.getAllReports(), "Reports fetched successfully");
    }

    @PutMapping("/reports/{id}/review")
    public ResponseEntity<ApiResponse<Object>> markReportReviewed(@PathVariable String id) {
        adminService.updateReportStatus(id, "REVIEWED");
        return ApiResponse.success(null, "Report marked as reviewed");
    }

    @PutMapping("/reports/{id}/dismiss")
    public ResponseEntity<ApiResponse<Object>> dismissReport(@PathVariable String id) {
        adminService.updateReportStatus(id, "DISMISSED");
        return ApiResponse.success(null, "Report dismissed");
    }
}
