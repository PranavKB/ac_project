package com.cdac.carpooling.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.dto.LocationDto;
import com.cdac.carpooling.dto.RideCreationRequest;
import com.cdac.carpooling.dto.RideSearchRequest;
import com.cdac.carpooling.model.LocationPoint;
import com.cdac.carpooling.model.Notification;
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.model.RideRequest;
import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.RideRepository;
import com.cdac.carpooling.repository.RideRequestRepository;
import com.cdac.carpooling.repository.UserRepository;
import com.cdac.carpooling.service.CarbonService;
import com.cdac.carpooling.service.H3Service;
import com.cdac.carpooling.service.NotificationService;
import com.cdac.carpooling.service.RideLifecycleService;
import com.cdac.carpooling.service.RideMatchingService;
import com.cdac.carpooling.service.RoutingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
public class RideController {
    private final H3Service h3Service;
    private final RideMatchingService rideMatchingService;
    private final RideRepository rideRepository;
    private final RideRequestRepository rideRequestRepository;
    private final RoutingService routingService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final RideLifecycleService rideLifecycleService;

    private static final int MAX_MULTI_DAY_RANGE = 30;
    private static final List<String> ACTIVE_RIDE_STATUSES = List.of("ACTIVE", "ONGOING");

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> createRide(@Valid @RequestBody RideCreationRequest request) {
        Instant departureTime;
        if (request.getDepartureTime() != null && !request.getDepartureTime().isBlank()) {
            departureTime = Instant.parse(request.getDepartureTime());
        } else {
            // Default 1 hour from start time
            departureTime = Instant.now().plusSeconds(3600);
        }

        if (departureTime.isBefore(Instant.now())) {
            return ApiResponse.error("Departure time cannot be in the past", HttpStatus.BAD_REQUEST);
        }
        if (rideRepository.existsByDriverIdAndDepartureTimeAndStatusIn(request.getDriverId(), departureTime,
                ACTIVE_RIDE_STATUSES)) {
            return ApiResponse.error("You already have a ride scheduled at this exact date and time",
                    HttpStatus.BAD_REQUEST);
        }

        Ride ride = new Ride();
        ride.setDriverId(request.getDriverId());
        ride.setDriverName(request.getDriverName());
        ride.setTotalSeats(request.getTotalSeats());
        ride.setAvailableSeats(request.getTotalSeats());
        ride.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        ride.setPricePerSeat(request.getPricePerSeat());
        ride.setStatus("ACTIVE");
        ride.setDepartureTime(departureTime);

        ride.setSource(parseLocationDto(request.getSource()));
        ride.setDestination(parseLocationDto(request.getDestination()));
        List<Double> srccoords = request.getSource().getLocation().getCoordinates();
        List<Double> dstcoords = request.getDestination().getLocation().getCoordinates();

        double srcLng = srccoords.get(0);
        double srcLat = srccoords.get(1);
        double destLng = dstcoords.get(0);
        double destLat = dstcoords.get(1);

        // Fetch full driving polyline & H3 segments immediately upon ride creation
        List<List<Double>> routeCoords = routingService.getRouteCoordinates(srcLat, srcLng, destLat, destLng);
        List<String> fullH3 = h3Service.pathToH3Segments(routeCoords);

        ride.setH3RouteSegments(fullH3);
        ride.setRouteCoords(routeCoords);
        ride.setCurrentLocation(srccoords);

        // Build execution details
        Ride.ExecutionDetails details = new Ride.ExecutionDetails();
        details.setActualDistanceKm(0);
        ride.setExecutionDetails(details);

        Ride saved = rideRepository.save(ride);
        if (saved == null) {
            return ApiResponse.error("Failed to create ride. Please try again.");
        }
        return ApiResponse.success(saved, "Ride created Successfully");
    }

    @PostMapping("/multi-day")
    public ResponseEntity<ApiResponse<Object>> createMultiDayRides(@Valid @RequestBody RideCreationRequest request) {
        List<Double> srccoords = request.getSource().getLocation().getCoordinates();
        List<Double> dstcoords = request.getDestination().getLocation().getCoordinates();

        double srcLng = srccoords.get(0);
        double srcLat = srccoords.get(1);
        double destLng = dstcoords.get(0);
        double destLat = dstcoords.get(1);

        Instant firstDeparture;
        if (request.getDepartureTime() != null && !request.getDepartureTime().isBlank()) {
            firstDeparture = Instant.parse(request.getDepartureTime());
        } else {
            firstDeparture = Instant.now().plusSeconds(3600);
        }

        ZonedDateTime firstZoned = firstDeparture.atZone(ZoneOffset.UTC);
        LocalDate startDate = firstZoned.toLocalDate();
        LocalTime timeOfDay = firstZoned.toLocalTime();

        LocalDate endDate = startDate;
        if (request.getToDate() != null && !request.getToDate().isBlank()) {
            try {
                endDate = LocalDate.parse(request.getToDate());
            } catch (Exception e) {
                return ApiResponse.error("Invalid toDate format, expected YYYY-MM-DD", HttpStatus.BAD_REQUEST);
            }
        }

        if (firstDeparture.isBefore(Instant.now())) {
            return ApiResponse.error("Departure time cannot be in the past", HttpStatus.BAD_REQUEST);
        }

        if (endDate.isBefore(startDate)) {
            return ApiResponse.error("To date must be on or after the departure date", HttpStatus.BAD_REQUEST);
        }

        long spanDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (spanDays > MAX_MULTI_DAY_RANGE) {
            return ApiResponse.error("Date range cannot exceed " + MAX_MULTI_DAY_RANGE + " days",
                    HttpStatus.BAD_REQUEST);
        }

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            Instant candidateDeparture = date.atTime(timeOfDay).atZone(ZoneOffset.UTC).toInstant();
            if (rideRepository.existsByDriverIdAndDepartureTimeAndStatusIn(request.getDriverId(),
                    candidateDeparture, ACTIVE_RIDE_STATUSES)) {
                return ApiResponse.error(
                        "You already have a ride scheduled on " + date + " at this exact time",
                        HttpStatus.BAD_REQUEST);
            }
        }

        // Fetch the driving polyline & H3 segments once - the route is identical for
        // every day
        List<List<Double>> routeCoords = routingService.getRouteCoordinates(srcLat, srcLng, destLat, destLng);
        List<String> fullH3 = h3Service.pathToH3Segments(routeCoords);

        List<Ride> rides = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            Instant departureTime = date.atTime(timeOfDay).atZone(ZoneOffset.UTC).toInstant();
            rides.add(buildRide(request, departureTime, srccoords, routeCoords, fullH3));
        }

        List<Ride> saved = rideRepository.saveAll(rides);
        return ApiResponse.success(saved, saved.size() + " ride(s) published successfully");
    }

    private Ride buildRide(RideCreationRequest request, Instant departureTime, List<Double> srccoords,
            List<List<Double>> routeCoords, List<String> fullH3) {
        Ride ride = new Ride();
        ride.setDriverId(request.getDriverId());
        ride.setDriverName(request.getDriverName());
        ride.setTotalSeats(request.getTotalSeats());
        ride.setAvailableSeats(request.getTotalSeats());
        ride.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        ride.setPricePerSeat(request.getPricePerSeat());
        ride.setStatus("ACTIVE");
        ride.setDepartureTime(departureTime);
        ride.setSource(parseLocationDto(request.getSource()));
        ride.setDestination(parseLocationDto(request.getDestination()));
        ride.setH3RouteSegments(fullH3);
        ride.setRouteCoords(routeCoords);
        ride.setCurrentLocation(srccoords);

        Ride.ExecutionDetails details = new Ride.ExecutionDetails();
        details.setActualDistanceKm(0);
        ride.setExecutionDetails(details);
        return ride;
    }

    private LocationPoint parseLocationDto(LocationDto dto) {
        if (dto == null)
            return null;
        LocationPoint lp = new LocationPoint();
        lp.setName(dto.getName());

        if (dto.getLocation() != null) {
            LocationPoint.GeoJsonPoint gp = new LocationPoint.GeoJsonPoint();
            gp.setType(dto.getLocation().getType() != null ? dto.getLocation().getType() : "Point");

            List<Double> coords = dto.getLocation().getCoordinates();
            if (coords != null && coords.size() == 2) {
                gp.setCoordinates(new double[] { coords.get(0), coords.get(1) });
            }
            lp.setLocation(gp);
        }
        return lp;

    }

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Object>> searchRides(@Valid @RequestBody RideSearchRequest request) {
        List<Double> src = request.getSourceCoords();
        List<Double> dst = request.getDestinationCoords();

        if (src == null || dst == null) {
            return ApiResponse.error("Invalid coordinates provided", HttpStatus.BAD_REQUEST);
        }

        try {
            double pSrcLat = src.get(0);
            double pSrcLng = src.get(1);
            double pDestLat = dst.get(0);
            double pDestLng = dst.get(1);

            String departureDate = request.getDepartureDate();
            Integer requestedSeats = request.getRequestedSeats() != null ? request.getRequestedSeats() : 1;
            List<List<Double>> routeCoords = routingService.getRouteCoordinates(pSrcLat, pSrcLng, pDestLat, pDestLng);
            List<String> passengerH3 = h3Service.pathToH3Segments(routeCoords);

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String excludeDriverId = null;
            if (authentication != null && authentication.getName() != null) {
                excludeDriverId = userRepository.findByEmail(authentication.getName())
                        .map(User::getId)
                        .orElse(null);
            }

            List<Map<String, Object>> matches = rideMatchingService.findMatchingRides(pSrcLat, pSrcLng, pDestLat,
                    pDestLng, passengerH3, departureDate, requestedSeats, excludeDriverId);
            return ApiResponse.success(matches, "Matching rides fetched successfully");
        } catch (Exception e) {
            return ApiResponse.error("Something went wrong on the server: " + e.getMessage());
        }
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<ApiResponse<Object>> getDriverRides(@PathVariable String driverId) {

        List<Ride> rides = rideRepository.findByDriverId(driverId);
        return ApiResponse.success(rides, "Driver rides fetched successfully");
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getRide(@PathVariable String id) {
        Ride ride = rideRepository.findById(id).orElse(null);
        if (ride == null) {
            return ApiResponse.error("Ride not found");
        }
        return ApiResponse.success(ride, "Ride fetched successfully");
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<Ride>> startRide(@PathVariable String id) {
        Ride ride = rideRepository.findById(id).orElse(null);
        if (ride == null) {
            return ApiResponse.error("Ride not found", HttpStatus.NOT_FOUND);
        }
        // Build execution details
        Ride.ExecutionDetails details = new Ride.ExecutionDetails();
        details.setStartTime(Instant.now());
        ride.setExecutionDetails(details);
        ride.setStatus("ONGOING");
        Ride saved = rideRepository.save(ride);

        if (saved.getPassengerIds() != null) {
            for (String passengerId : saved.getPassengerIds()) {
                notificationService.create(passengerId, Notification.Type.RIDE_STARTED,
                        "Ride started", "Your ride has started.", saved.getId());
            }
        }

        return ApiResponse.success(saved, "Ride started successfully");
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<Ride>> completeRide(@PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body) {

        Ride ride = rideRepository.findById(id).orElse(null);
        if (ride == null) {
            return ApiResponse.error("Ride not found", HttpStatus.NOT_FOUND);
        }

        double distanceKm = body != null && body.get("actualDistanceKm") != null
                ? ((Number) body.get("actualDistanceKm")).doubleValue()
                : 10.0;

        Ride saved = rideLifecycleService.completeRide(ride, distanceKm);

        return ApiResponse.success(saved, "Ride completed successfully");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteRide(@PathVariable String id) {
        Ride ride = rideRepository.findById(id).orElse(null);
        if (ride == null) {
            return ApiResponse.error("Ride not found", HttpStatus.NOT_FOUND);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return ApiResponse.error("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (currentUser == null) {
            return ApiResponse.error("User not found", HttpStatus.UNAUTHORIZED);
        }

        boolean isAdmin = currentUser.getRoles() != null && currentUser.getRoles().contains("ROLE_ADMIN");
        if (!ride.getDriverId().equals(currentUser.getId()) && !isAdmin) {
            return ApiResponse.error("You are not authorized to delete this ride", HttpStatus.FORBIDDEN);
        }

        if ("COMPLETED".equals(ride.getStatus())) {
            return ApiResponse.error("Cannot delete a completed ride", HttpStatus.BAD_REQUEST);
        }

        // Notify and cancel any passenger ride requests for this ride
        List<RideRequest> requests = rideRequestRepository.findByRideId(id);
        if (requests != null && !requests.isEmpty()) {
            String srcName = ride.getSource() != null ? ride.getSource().getName().split(",")[0] : "source";
            String destName = ride.getDestination() != null ? ride.getDestination().getName().split(",")[0] : "destination";
            for (RideRequest req : requests) {
                req.setStatus("CANCELLED");
                rideRequestRepository.save(req);
                notificationService.create(
                        req.getPassengerId(),
                        Notification.Type.RIDE_CANCELLED,
                        "Ride Cancelled",
                        "The driver has cancelled the ride from " + srcName + " to " + destName + ".",
                        ride.getId()
                );
            }
        }

        if (ride.getPassengerIds() != null) {
            for (String passengerId : ride.getPassengerIds()) {
                notificationService.create(
                        passengerId,
                        Notification.Type.RIDE_CANCELLED,
                        "Ride Cancelled",
                        "A ride you booked was cancelled by the driver.",
                        ride.getId()
                );
            }
        }

        ride.setStatus("CANCELLED");
        rideRepository.save(ride);

        return ApiResponse.success(null, "Ride deleted successfully");
    }

}
