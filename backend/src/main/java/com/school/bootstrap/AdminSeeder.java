package com.school.bootstrap;

import com.school.document.Role;
import com.school.document.User;
import com.school.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

// Solves the chicken-and-egg problem: only an Admin can create an Admin via
// the API, but there's no Admin on a fresh database. On every startup this
// checks whether ANY admin exists — if not, it creates one from env vars
// (or the defaults below, which you should absolutely override for
// anything beyond local dev). Runs once; after the first admin exists,
// this becomes a no-op on every subsequent startup.
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin-seed.name:System Admin}")
    private String seedName;

    @Value("${app.admin-seed.email:admin@school.edu}")
    private String seedEmail;

    @Value("${app.admin-seed.password:ChangeMe123!}")
    private String seedPassword;

    @Override
    public void run(String... args) {
        boolean adminExists = userRepository.findAll().stream()
                .anyMatch(u -> u.getRole() == Role.ADMIN);

        if (adminExists) {
            return;
        }

        User admin = User.builder()
                .name(seedName)
                .email(seedEmail)
                .password(passwordEncoder.encode(seedPassword))
                .role(Role.ADMIN)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        userRepository.save(admin);

        log.warn("No admin account existed, so one was seeded automatically.");
        log.warn("Seeded admin login -> email: {} | password: {}", seedEmail, seedPassword);
        log.warn("Log in with these and change the password immediately, or delete this account and create a proper one.");
    }
}