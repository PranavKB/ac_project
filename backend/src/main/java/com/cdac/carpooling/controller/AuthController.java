package com.cdac.carpooling.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cdac.carpooling.model.User;
import com.cdac.carpooling.service.AuthService;
import com.cdac.carpooling.security.JwtUtil;
import com.cdac.carpooling.dto.RegisterRequest;
import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.dto.LoginRequest;
import com.cdac.carpooling.dto.LoginResponse;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Object>> register(@RequestBody RegisterRequest request) {
        User user = authService.register(
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getPassword(),
                request.getRoles());
        return ApiResponse.success(user, "User registered successfully.");
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Object>> login(@RequestBody LoginRequest request) {
        User user = authService.login(
                request.getEmail(),
                request.getPassword());
        if (user == null) {
            return ApiResponse.error("User not found.");
        }
        String token = jwtUtil.generateToken(user.getEmail());
        LoginResponse loginResponse = new LoginResponse(token, user);
        return ApiResponse.success(loginResponse, "User logged in successfully.");
    }
}
