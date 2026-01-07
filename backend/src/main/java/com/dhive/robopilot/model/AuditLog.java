package com.dhive.robopilot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String username;

    private String companyId;

    @Column(nullable = false)
    private String action; // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, START, STOP, PLAY

    @Column(nullable = false)
    private String entityType; // USER, COMPANY, SITE, MISSION, ROBOT, TASK, VIDEO

    private String entityId;

    @Column(length = 500)
    private String description;

    private String ipAddress;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
