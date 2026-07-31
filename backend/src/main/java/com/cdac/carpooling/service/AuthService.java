package com.cdac.carpooling.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.UserRepository;
import com.cdac.carpooling.security.JwtUtil;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Set<String> ALLOWED_PUBLIC_ROLES = Set.of("PASSENGER", "DRIVER");

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public void requestRegistrationLink(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already registered: " + email);
        }

        String registrationToken = jwtUtil.generateRegistrationToken(email);
        emailService.sendRegistrationLinkEmail(email, registrationToken);
    }

    public String verifyRegistrationToken(String token) {
        return jwtUtil.validateRegistrationToken(token);
    }

    public User register(String name, String email, String phone, String password, List<String> roles, String token) {
        if (token != null && !token.isBlank()) {
            String tokenEmail = jwtUtil.validateRegistrationToken(token);
            if (!tokenEmail.equalsIgnoreCase(email)) {
                throw new RuntimeException("Email does not match the registration token link");
            }
        }

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered: " + email);
        }

        List<String> sanitizedRoles = roles == null ? List.of()
                : roles.stream()
                        .filter(role -> role != null)
                        .map(String::toUpperCase)
                        .filter(ALLOWED_PUBLIC_ROLES::contains)
                        .distinct()
                        .toList();
        if (sanitizedRoles.isEmpty()) {
            throw new RuntimeException("At least one valid role (PASSENGER or DRIVER) is required");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles(sanitizedRoles);
        user.setReputationProfile(new User.ReputationProfile(80.0, 80.0, 80.0, "New user - no rides yet."));
        user.setTotalCarbonSavedKg(0.0);
        user.setCreatedAt(Instant.now());

        User savedUser = userRepository.save(user);

        emailService.sendRegistrationSuccessEmail(savedUser.getEmail(), savedUser.getName());

        return savedUser;
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        // Removing password
        user.setPassword(null);
        return user;
    }
}
