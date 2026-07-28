package com.cdac.carpooling.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.RideRepository;
import com.cdac.carpooling.repository.RideRequestRepository;
import com.cdac.carpooling.repository.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final RideRequestRepository rideRequestRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Object>> getStats() {
        long totalUsers = userRepository.count();
        long totalRides = rideRepository.count();
        long activeRides = rideRepository.findByStatus("ACTIVE").size();
        long ongoingRides = rideRepository.findByStatus("ONGOING").size();
        long completedRides = rideRepository.findByStatus("COMPLETED").size();
        long totalRequests = rideRequestRepository.count();

        Map<String, Object> stats = Map.of(
            "totalUsers", totalUsers,
            "totalRides", totalRides,
            "activeRides", activeRides,
            "ongoingRides", ongoingRides,
            "completedRides", completedRides,
            "totalRequests", totalRequests
        );
        return ApiResponse.success(stats, "Stats fetched successfully");
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Object>> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword(null));
        return ApiResponse.success(users, "Users fetched successfully");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteUser(@PathVariable String id) {
        if (!userRepository.existsById(id)) {
            return ApiResponse.error("User not found");
        }
        userRepository.deleteById(id);
        return ApiResponse.success(null, "User deleted successfully");
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<ApiResponse<Object>> banUser(@PathVariable String id) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ApiResponse.error("User not found");
        User user = opt.get();
        List<String> roles = user.getRoles();
        if (roles.contains("BANNED")) return ApiResponse.error("User already banned");
        roles.add("BANNED");
        user.setRoles(roles);
        userRepository.save(user);
        user.setPassword(null);
        return ApiResponse.success(user, "User banned successfully");
    }

    @PutMapping("/users/{id}/unban")
    public ResponseEntity<ApiResponse<Object>> unbanUser(@PathVariable String id) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ApiResponse.error("User not found");
        User user = opt.get();
        user.getRoles().remove("BANNED");
        userRepository.save(user);
        user.setPassword(null);
        return ApiResponse.success(user, "User unbanned successfully");
    }

    @GetMapping("/rides")
    public ResponseEntity<ApiResponse<Object>> getAllRides() {
        List<Ride> rides = rideRepository.findAll();
        return ApiResponse.success(rides, "Rides fetched successfully");
    }

    @DeleteMapping("/rides/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteRide(@PathVariable String id) {
        if (!rideRepository.existsById(id)) {
            return ApiResponse.error("Ride not found");
        }
        rideRepository.deleteById(id);
        return ApiResponse.success(null, "Ride deleted successfully");
    }
}
