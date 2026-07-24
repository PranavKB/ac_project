package com.cdac.carpooling.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.UserRepository;
import com.cdac.carpooling.security.JwtUtil;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

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

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles(roles);
        user.setReputationProfile(new User.ReputationProfile(80.0, 80.0, 80.0, "New user — no rides yet."));
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
