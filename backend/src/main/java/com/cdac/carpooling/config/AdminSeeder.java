package com.cdac.carpooling.config;

import java.time.Instant;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "admin@carpool.com";
    private static final String ADMIN_DEFAULT_PASSWORD = "Admin@123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            return;
        }

        User admin = new User();
        admin.setName("Platform Admin");
        admin.setEmail(ADMIN_EMAIL);
        admin.setPhone("0000000000");
        admin.setPassword(passwordEncoder.encode(ADMIN_DEFAULT_PASSWORD));
        admin.setRoles(List.of("ADMIN"));
        admin.setReputationProfile(new User.ReputationProfile(80.0, 80.0, 80.0, "Platform administrator account."));
        admin.setTotalCarbonSavedKg(0.0);
        admin.setCreatedAt(Instant.now());

        userRepository.save(admin);
        System.out.println("[AdminSeeder] Bootstrapped admin account: " + ADMIN_EMAIL);
    }
}
