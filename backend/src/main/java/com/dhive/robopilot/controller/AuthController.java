package com.dhive.robopilot.controller;

import com.dhive.robopilot.model.User;
import com.dhive.robopilot.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String emailOrUsername = credentials.get("username");
        String password = credentials.get("password");

        log.info("Login attempt for user: {}", emailOrUsername);

        // Try to find user by email first, then by username
        Optional<User> userOpt = userService.getUserByEmail(emailOrUsername);
        log.info("User search by email: {}", userOpt.isPresent() ? "Found" : "Not found");

        if (userOpt.isEmpty()) {
            userOpt = userService.getUserByUsername(emailOrUsername);
            log.info("User search by username: {}", userOpt.isPresent() ? "Found" : "Not found");
        }

        if (userOpt.isEmpty()) {
            log.warn("User not found: {}", emailOrUsername);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();
        log.info("User found: id={}, email={}, role={}", user.getId(), user.getEmail(), user.getRole());

        // Verify password
        boolean passwordMatches = passwordEncoder.matches(password, user.getPassword());
        log.info("Password verification: {}", passwordMatches ? "SUCCESS" : "FAILED");

        if (!passwordMatches) {
            log.warn("Password mismatch for user: {}", emailOrUsername);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid credentials"));
        }

        // Check if user is active
        if (!"ACTIVE".equals(user.getStatus())) {
            log.warn("Inactive user login attempt: {}", emailOrUsername);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "User account is not active"));
        }

        // Return user info
        log.info("Login successful for user: {}", emailOrUsername);

        Map<String, Object> response = new HashMap<>();
        response.put("token", "jwt-token-" + user.getId());
        response.put("user", Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "name", user.getName(),
            "email", user.getEmail(),
            "role", user.getRole(),
            "companyId", user.getCompanyId() != null ? user.getCompanyId() : "",
            "companyName", user.getCompanyName() != null ? user.getCompanyName() : ""
        ));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        // TODO: Get actual user from JWT token
        Map<String, Object> user = new HashMap<>();
        user.put("username", "admin");
        user.put("name", "Admin User");
        user.put("email", "admin@robopilot.com");
        user.put("role", "ADMIN");
        return ResponseEntity.ok(user);
    }
}
