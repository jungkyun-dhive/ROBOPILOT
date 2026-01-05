package com.dhive.robopilot.controller;

import com.dhive.robopilot.model.User;
import com.dhive.robopilot.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String emailOrUsername = credentials.get("username");
        String password = credentials.get("password");

        // Try to find user by email first, then by username
        Optional<User> userOpt = userService.getUserByEmail(emailOrUsername);
        if (userOpt.isEmpty()) {
            userOpt = userService.getUserByUsername(emailOrUsername);
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();

        // Verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid credentials"));
        }

        // Check if user is active
        if (!"ACTIVE".equals(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "User account is not active"));
        }

        // Return user info
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
