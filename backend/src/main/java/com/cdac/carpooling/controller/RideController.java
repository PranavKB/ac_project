package com.cdac.carpooling.controller;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.repository.RideRepository;
import com.cdac.carpooling.service.CarbonService;
import com.cdac.carpooling.service.H3Service;
import com.cdac.carpooling.service.RideMatchingService;
import com.cdac.carpooling.service.RoutingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
public class RideController {
    private final H3Service h3Service;
    private final RideMatchingService rideMatchingService;
    private final RideRepository rideRepository;
    private final CarbonService carbonService;
    private final RoutingService routingService;

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> createRide(@Valid @RequestBody RideCreationRequest request) {
        Ride ride = new Ride();
        ride.setDriverId(request.getDriverId());
        ride.setDriverName(request.getDriverName());
        ride.setTotalSeats(request.getTotalSeats());
        ride.setAvailableSeats(request.getTotalSeats());
        ride.setStatus("ACTIVE");

        if (request.getDepartureTime() != null && !request.getDepartureTime().isBlank()) {
            ride.setDepartureTime(Instant.parse(request.getDepartureTime()));
        } else {
            // Default 1 hour from start time
            ride.setDepartureTime(Instant.now().plusSeconds(3600));
        }

        ride.setSource(parseLocationDto(request.getSource()));
        ride.setDestination(parseLocationDto(request.getDestination()));
        List<Double> srccoords = request.getSource().getLocation().getCoordinates();
        List<Double> dstcoords = request.getDestination().getLocation().getCoordinates();
        String startH3 = h3Service.pathToH3Segments(List.of(List.of(srccoords.get(1), srccoords.get(0)))).get(0);
        String endH3 = h3Service.pathToH3Segments(List.of(List.of(dstcoords.get(1), dstcoords.get(0)))).get(0);
        ride.setH3RouteSegments(List.of(startH3, endH3));
        ride.setRouteCoords(
                List.of(List.of(srccoords.get(1), srccoords.get(0)), List.of(dstcoords.get(1), dstcoords.get(0))));
        // Initialize currentLocation as starting coordinate
        ride.setCurrentLocation(srccoords);
        // Build execution details
        Ride.ExecutionDetails details = new Ride.ExecutionDetails();
        details.setActualDistanceKm(0);
        ride.setExecutionDetails(details);
        Ride saved = rideRepository.save(ride);
        if (saved == null) {
            return ApiResponse.error("Failed to create ride. Please try again.");
        }
        // Asynchronously populate the full polyline H3 segments in background
        rideMatchingService.populateRouteH3SegmentsAsync(saved.getId(), srccoords.get(0), srccoords.get(1),
                dstcoords.get(0), dstcoords.get(1));
        return ApiResponse.success(saved, "Ride created Successfully");
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
            // Fetch full driving polyline coordinates for the passenger's route
            List<List<Double>> routeCoords = routingService.getRouteCoordinates(
                    src.get(0), src.get(1),
                    dst.get(0), dst.get(1));
            List<String> passengerH3 = h3Service.pathToH3Segments(routeCoords);
            List<Map<String, Object>> matches = rideMatchingService.findMatchingRides(passengerH3);
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
        return ApiResponse.success(saved, "Ride started successfully");
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<Ride>> completeRide(@PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body) {

        Ride ride = rideRepository.findById(id).orElse(null);
        if (ride == null) {
            return ApiResponse.error("Ride not found", HttpStatus.NOT_FOUND);
        }

        ride.setStatus("COMPLETED");

        // Keep only start and end H3 segments, deleting the intermediate path cells to
        // save storage space
        List<String> h3Segments = ride.getH3RouteSegments();
        if (h3Segments != null && h3Segments.size() >= 2) {
            String startH3 = h3Segments.get(0);
            String endH3 = h3Segments.get(h3Segments.size() - 1);
            ride.setH3RouteSegments(List.of(startH3, endH3));
        }
        List<List<Double>> routeCords = ride.getRouteCoords();
        if (routeCords != null && routeCords.size() >= 2) {
            List<Double> startCoord = routeCords.get(0);
            List<Double> endCoord = routeCords.get(routeCords.size() - 1);
            ride.setRouteCoords(List.of(startCoord, endCoord));
        }

        // Build execution details
        Ride.ExecutionDetails details = new Ride.ExecutionDetails();
        details.setStartTime(ride.getExecutionDetails().getStartTime());
        details.setEndTime(Instant.now());

        double distanceKm = body != null && body.get("actualDistanceKm") != null
                ? ((Number) body.get("actualDistanceKm")).doubleValue()
                : 10.0;
        details.setActualDistanceKm(distanceKm);

        int passengerCount = ride.getPassengerIds().size();
        Ride.EnvironmentalOffset offset = carbonService.calculateOffset(distanceKm, Math.max(1, passengerCount));
        details.setEnvironmentalOffset(offset);

        List<LocationPoint.GeoJsonPoint> traj = new ArrayList<>();
        if (ride.getSource() != null && ride.getSource().getLocation() != null) {
            traj.add(ride.getSource().getLocation());
        }
        if (ride.getDestination() != null && ride.getDestination().getLocation() != null) {
            traj.add(ride.getDestination().getLocation());
        }
        details.setActualTrajectoryPoints(traj);

        ride.setExecutionDetails(details);

        Ride saved = rideRepository.save(ride);

        return ApiResponse.success(saved, "Ride completed successfully");

    }

}
