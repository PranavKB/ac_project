package com.cdac.carpooling.service;

import com.cdac.carpooling.dto.RideRequestDto;
import com.cdac.carpooling.model.RideRequest;
import com.cdac.carpooling.repository.RideRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RideRequestService {

    private final RideRequestRepository rideRequestRepository;

    // CREATE: Convert DTO to Model and save
    public RideRequest createRequest(RideRequestDto dto) {
        RideRequest request = new RideRequest();

        request.setRideId(dto.getRideId());
        request.setPassengerId(dto.getPassengerId());
        request.setPassengerName(dto.getPassengerName());
        request.setSource(dto.getSource());
        request.setDestination(dto.getDestination());
        request.setPassengerH3Segments(dto.getPassengerH3Segments());

        // Defaults
        request.setStatus("PENDING");
        request.setCreatedAt(Instant.now());
        request.setPriorityScore(0.0);

        return rideRequestRepository.save(request);
    }

    // READ: Get requests for a specific ride
    public List<RideRequest> getRequestsByRide(String rideId) {
        return rideRequestRepository.findByRideId(rideId);
    }

    // READ: Get pending requests for a specific ride (Filtered)
    public List<RideRequest> getPendingRequestsByRide(String rideId) {
        return rideRequestRepository.findByRideIdAndStatus(rideId, "PENDING");
    }

    // UPDATE: Update status (e.g., APPROVE or REJECT)
    public RideRequest updateStatus(String requestId, String status) {
        Optional<RideRequest> optionalRequest = rideRequestRepository.findById(requestId);

        if (optionalRequest.isPresent()) {
            RideRequest request = optionalRequest.get();
            request.setStatus(status);
            return rideRequestRepository.save(request);
        } else {
            throw new RuntimeException("Ride request not found with ID: " + requestId);
        }
    }

    // READ: Get all requests for a specific user
    public List<RideRequest> getMyRequests(String passengerId) {
        return rideRequestRepository.findByPassengerId(passengerId);
    }
}