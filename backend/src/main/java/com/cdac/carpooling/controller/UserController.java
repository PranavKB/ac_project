package com.cdac.carpooling.controller;

import lombok.RequiredArgsConstructor;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getUser(@PathVariable String id) {
        Optional<User> userOptional = userRepository.findById(id);

        if (userOptional.isEmpty()) {
            return ApiResponse.error("User not found with id: " + id);
        }

        User user = userOptional.get();
        user.setPassword(null);

        return ApiResponse.success(user, "User retrieved successfully");
    }
}
