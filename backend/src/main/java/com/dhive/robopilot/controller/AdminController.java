package com.dhive.robopilot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/generate-hash")
    public ResponseEntity<Map<String, String>> generateHash(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        if (password == null || password.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Password is required");
            return ResponseEntity.badRequest().body(error);
        }

        String hash = passwordEncoder.encode(password);
        boolean matches = passwordEncoder.matches(password, hash);

        Map<String, String> response = new HashMap<>();
        response.put("password", password);
        response.put("hash", hash);
        response.put("verification", String.valueOf(matches));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Admin API is working");
    }
}
