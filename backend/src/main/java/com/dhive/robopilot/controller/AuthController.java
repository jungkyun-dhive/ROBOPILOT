package com.dhive.robopilot.controller;

import com.dhive.robopilot.model.User;
import com.dhive.robopilot.service.UserService;
import com.dhive.robopilot.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

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
        log.info("Input password length: {}", password != null ? password.length() : 0);
        log.info("Stored hash: {}", user.getPassword());
        log.info("Hash starts with: {}", user.getPassword().substring(0, 7));

        boolean passwordMatches = passwordEncoder.matches(password, user.getPassword());
        log.info("Password verification: {}", passwordMatches ? "SUCCESS" : "FAILED");

        // Additional debugging: try encoding the input password to see the format
        String testHash = passwordEncoder.encode(password);
        log.info("Test encoding of input password: {}", testHash.substring(0, 30));

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

        // Generate JWT token
        log.info("Login successful for user: {} with siteIds: {}", emailOrUsername, user.getSiteIds());
        String token = jwtUtil.generateToken(
            user.getId(),
            user.getUsername(),
            user.getRole(),
            user.getCompanyId()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "name", user.getName(),
            "email", user.getEmail(),
            "role", user.getRole(),
            "companyId", user.getCompanyId() != null ? user.getCompanyId() : "",
            "companyName", user.getCompanyName() != null ? user.getCompanyName() : "",
            "siteIds", user.getSiteIds() != null ? user.getSiteIds() : java.util.List.of()
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
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }

        User user = (User) authentication.getPrincipal();

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("companyId", user.getCompanyId() != null ? user.getCompanyId() : "");
        response.put("companyName", user.getCompanyName() != null ? user.getCompanyName() : "");
        response.put("siteIds", user.getSiteIds() != null ? user.getSiteIds() : java.util.List.of());

        return ResponseEntity.ok(response);
    }
}
