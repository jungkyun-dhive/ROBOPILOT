package com.dhive.robopilot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        // TODO: Implement actual authentication
        Map<String, Object> response = new HashMap<>();
        response.put("token", "dummy-jwt-token");
        response.put("user", Map.of(
            "username", username,
            "name", "Admin User",
            "role", "ADMIN"
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
