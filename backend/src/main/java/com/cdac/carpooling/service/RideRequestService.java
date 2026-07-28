package com.cdac.carpooling.service;

import com.cdac.carpooling.dto.RideRequestDto;
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.model.RideRequest;
import com.cdac.carpooling.repository.RideRepository;
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
    private final RideRepository rideRepository;

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
            String oldStatus = request.getStatus();

            if (!"APPROVED".equals(oldStatus) && "APPROVED".equals(status)) {
                approveSeat(request);
            } else if ("APPROVED".equals(oldStatus)
                    && ("REJECTED".equals(status) || "CANCELLED".equals(status))) {
                releaseSeat(request);
            }

            request.setStatus(status);
            return rideRequestRepository.save(request);
        } else {
            throw new RuntimeException("Ride request not found with ID: " + requestId);
        }
    }

    private void approveSeat(RideRequest request) {
        Ride ride = rideRepository.findById(request.getRideId())
                .orElseThrow(() -> new RuntimeException("Ride not found with ID: " + request.getRideId()));

        if (ride.getAvailableSeats() <= 0) {
            throw new RuntimeException("No seats available for this ride");
        }

        ride.setAvailableSeats(ride.getAvailableSeats() - 1);
        if (!ride.getPassengerIds().contains(request.getPassengerId())) {
            ride.getPassengerIds().add(request.getPassengerId());
        }
        rideRepository.save(ride);
    }

    private void releaseSeat(RideRequest request) {
        Ride ride = rideRepository.findById(request.getRideId()).orElse(null);
        if (ride == null) {
            return;
        }

        ride.setAvailableSeats(Math.min(ride.getTotalSeats(), ride.getAvailableSeats() + 1));
        ride.getPassengerIds().remove(request.getPassengerId());
        rideRepository.save(ride);
    }

    public List<RideRequest> getMyRequests(String passengerId) {
        return rideRequestRepository.findByPassengerId(passengerId);
    }
}
