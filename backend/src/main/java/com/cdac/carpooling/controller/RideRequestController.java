package com.cdac.carpooling.controller;

import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.dto.RideRequestDto;
import com.cdac.carpooling.model.RideRequest;
import com.cdac.carpooling.service.RideRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ride-requests")
@RequiredArgsConstructor
public class RideRequestController {

    private final RideRequestService rideRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> createRequest(@RequestBody RideRequestDto dto) {
        try {
            RideRequest saved = rideRequestService.createRequest(dto);
            if (saved == null) {
                return ApiResponse.error("Failed to create ride request. Please try again.");
            }
            return ApiResponse.success(saved, "Ride request created successfully");
        } catch (Exception e) {
            return ApiResponse.error("An error occurred while creating the request: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Object>> approveRequest(@PathVariable String id) {
        try {
            RideRequest updated = rideRequestService.updateStatus(id, "APPROVED");
            return ApiResponse.success(updated, "Request approved successfully");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Object>> rejectRequest(@PathVariable String id) {
        try {
            RideRequest updated = rideRequestService.updateStatus(id, "REJECTED");
            return ApiResponse.success(updated, "Request rejected");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Object>> cancelRequest(@PathVariable String id) {
        try {
            RideRequest updated = rideRequestService.updateStatus(id, "CANCELLED");
            return ApiResponse.success(updated, "Request cancelled");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/ride/{rideId}")
    public ResponseEntity<ApiResponse<Object>> getRideRequests(@PathVariable String rideId) {
        List<RideRequest> requests = rideRequestService.getRequestsByRide(rideId);
        return ApiResponse.success(requests, "Requests retrieved successfully");
    }

    @GetMapping("/passenger/{passengerId}")
    public ResponseEntity<ApiResponse<Object>> getPassengerRequests(@PathVariable String passengerId) {
        List<RideRequest> requests = rideRequestService.getMyRequests(passengerId);
        return ApiResponse.success(requests, "Passenger requests retrieved");
    }
}
