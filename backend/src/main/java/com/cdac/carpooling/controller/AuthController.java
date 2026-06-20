package com.cdac.carpooling.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cdac.carpooling.model.User;
import com.cdac.carpooling.service.AuthService;
import com.cdac.carpooling.dto.RegisterRequest;
import com.cdac.carpooling.dto.LoginRequest;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(
            request.getName(),
            request.getEmail(),
            request.getPhone(),
            request.getPassword(),
            request.getRoles()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(
            request.getEmail(), 
            request.getPassword()
        ));
    }
}
