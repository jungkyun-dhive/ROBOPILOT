package com.dhive.robopilot.controller;

import com.dhive.robopilot.model.AuditLog;
import com.dhive.robopilot.model.User;
import com.dhive.robopilot.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {
    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User currentUser = (User) authentication.getPrincipal();

        // SYSTEM_ADMIN can see all audit logs
        if ("SYSTEM_ADMIN".equals(currentUser.getRole())) {
            return ResponseEntity.ok(auditLogService.getAllAuditLogs());
        }

        // COMPANY_ADMIN can see audit logs from their company
        if ("COMPANY_ADMIN".equals(currentUser.getRole()) && currentUser.getCompanyId() != null) {
            return ResponseEntity.ok(auditLogService.getAuditLogsByCompanyId(currentUser.getCompanyId()));
        }

        // OPERATOR can only see their own audit logs
        if ("OPERATOR".equals(currentUser.getRole())) {
            return ResponseEntity.ok(auditLogService.getAuditLogsByUserId(currentUser.getId()));
        }

        return ResponseEntity.ok(List.of());
    }

    @PostMapping
    public ResponseEntity<AuditLog> createAuditLog(@RequestBody AuditLog auditLog) {
        AuditLog created = auditLogService.createAuditLog(auditLog);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
