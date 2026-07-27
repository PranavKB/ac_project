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

    public RideRequest createRequest(RideRequestDto dto) {
        List<RideRequest> existing = rideRequestRepository.findByPassengerId(dto.getPassengerId());
        boolean hasDuplicate = existing.stream().anyMatch(r ->
            dto.getRideId().equals(r.getRideId()) &&
            ("PENDING".equals(r.getStatus()) || "APPROVED".equals(r.getStatus()) || "ACCEPTED".equals(r.getStatus()))
        );

        if (hasDuplicate) {
            throw new RuntimeException("You already have an active booking request for this ride.");
        }

        RideRequest request = new RideRequest();

        request.setRideId(dto.getRideId());
        request.setPassengerId(dto.getPassengerId());
        request.setPassengerName(dto.getPassengerName());
        request.setSource(dto.getSource());
        request.setDestination(dto.getDestination());
        request.setPassengerH3Segments(dto.getPassengerH3Segments());

        request.setStatus("PENDING");
        request.setCreatedAt(Instant.now());
        request.setPriorityScore(0.0);

        return rideRequestRepository.save(request);
    }

    public List<RideRequest> getRequestsByRide(String rideId) {
        return rideRequestRepository.findByRideId(rideId);
    }

    public List<RideRequest> getPendingRequestsByRide(String rideId) {
        return rideRequestRepository.findByRideIdAndStatus(rideId, "PENDING");
    }

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

    public List<RideRequest> getMyRequests(String passengerId) {
        return rideRequestRepository.findByPassengerId(passengerId);
    }
}
