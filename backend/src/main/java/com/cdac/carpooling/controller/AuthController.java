package com.cdac.carpooling.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cdac.carpooling.model.User;
import com.cdac.carpooling.service.AuthService;
import com.cdac.carpooling.security.JwtUtil;
import com.cdac.carpooling.dto.RegisterRequest;
import com.cdac.carpooling.dto.RegisterLinkRequest;
import com.cdac.carpooling.dto.ForgotPasswordRequest;
import com.cdac.carpooling.dto.ResetPasswordRequest;
import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.dto.LoginRequest;
import com.cdac.carpooling.dto.LoginResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/request-register-link")
    public ResponseEntity<ApiResponse<Object>> requestRegisterLink(@Valid @RequestBody RegisterLinkRequest request) {
        authService.requestRegistrationLink(request.getEmail());
        return ApiResponse.success(null, "Registration link sent to your email. Please check your inbox.");
    }

    @GetMapping("/verify-token")
    public ResponseEntity<ApiResponse<Object>> verifyToken(@RequestParam("token") String token) {
        String email = authService.verifyRegistrationToken(token);
        return ApiResponse.success(email, "Registration token verified successfully.");
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Object>> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getPassword(),
                request.getRoles(),
                request.getToken());
        return ApiResponse.success(user, "User registered successfully. A confirmation email has been sent.");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.getEmail());
        return ApiResponse.success(null, "Password reset link sent to your email. Please check your inbox.");
    }

    @GetMapping("/verify-reset-token")
    public ResponseEntity<ApiResponse<Object>> verifyResetToken(@RequestParam("token") String token) {
        String email = authService.verifyPasswordResetToken(token);
        return ApiResponse.success(email, "Password reset token verified successfully.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ApiResponse.success(null, "Password reset successfully. You can now log in with your new password.");
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Object>> login(@Valid @RequestBody LoginRequest request) {
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
