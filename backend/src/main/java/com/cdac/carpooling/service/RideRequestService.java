package com.cdac.carpooling.service;

import com.cdac.carpooling.dto.RideRequestDto;
import com.cdac.carpooling.model.Notification;
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
    private final NotificationService notificationService;
    private final RideMatchingService rideMatchingService;

    public RideRequest createRequest(RideRequestDto dto) {
        List<RideRequest> existing = rideRequestRepository.findByRideIdAndPassengerId(dto.getRideId(), dto.getPassengerId());
        boolean hasDuplicate = existing.stream().anyMatch(r ->
            "PENDING".equals(r.getStatus()) || "APPROVED".equals(r.getStatus()) || "ACCEPTED".equals(r.getStatus())
        );

        if (hasDuplicate) {
            throw new RuntimeException("You already have an active booking request for this ride.");
        }

        for (RideRequest oldReq : existing) {
            if ("CANCELLED".equals(oldReq.getStatus()) || "REJECTED".equals(oldReq.getStatus())) {
                rideRequestRepository.delete(oldReq);
            }
        }

        int requestedSeats = dto.getRequestedSeats() > 0 ? dto.getRequestedSeats() : 1;
        Ride ride = rideRepository.findById(dto.getRideId())
                .orElseThrow(() -> new RuntimeException("Ride not found with ID: " + dto.getRideId()));
        if (requestedSeats > ride.getAvailableSeats()) {
            throw new RuntimeException("Only " + ride.getAvailableSeats() + " seat(s) left on this ride.");
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
        request.setRequestedSeats(requestedSeats);

        RideRequest saved = rideRequestRepository.save(request);

        notificationService.create(
                ride.getDriverId(),
                Notification.Type.BOOKING_REQUESTED,
                "New ride request",
                (dto.getPassengerName() != null ? dto.getPassengerName() : "A passenger")
                        + " requested to join your ride.",
                dto.getRideId());

        return saved;
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
                Ride ride = releaseSeat(request);
                if (ride != null) {
                    rideMatchingService.rankAndSuggestBackupCandidates(ride, request.getPassengerId());
                }
            }

            if ("APPROVED".equals(status)) {
                notificationService.create(request.getPassengerId(), Notification.Type.REQUEST_APPROVED,
                        "Request approved", "Your ride request was approved.", request.getRideId());
            } else if ("REJECTED".equals(status)) {
                notificationService.create(request.getPassengerId(), Notification.Type.REQUEST_REJECTED,
                        "Request rejected", "Your ride request was rejected.", request.getRideId());
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

        int seatsToDeduct = request.getRequestedSeats() > 0 ? request.getRequestedSeats() : 1;
        if (ride.getAvailableSeats() < seatsToDeduct) {
            throw new RuntimeException("Not enough seats available for this ride request");
        }

        ride.setAvailableSeats(ride.getAvailableSeats() - seatsToDeduct);
        if (!ride.getPassengerIds().contains(request.getPassengerId())) {
            ride.getPassengerIds().add(request.getPassengerId());
        }
        rideRepository.save(ride);
    }

    private Ride releaseSeat(RideRequest request) {
        Ride ride = rideRepository.findById(request.getRideId()).orElse(null);
        if (ride == null) {
            return null;
        }

        int seatsToRelease = request.getRequestedSeats() > 0 ? request.getRequestedSeats() : 1;
        ride.setAvailableSeats(Math.min(ride.getTotalSeats(), ride.getAvailableSeats() + seatsToRelease));
        ride.getPassengerIds().remove(request.getPassengerId());
        return rideRepository.save(ride);
    }

    public List<RideRequest> getMyRequests(String passengerId) {
        return rideRequestRepository.findByPassengerId(passengerId);
    }
}
