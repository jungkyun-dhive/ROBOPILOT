package com.dhive.robopilot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String role; // SYSTEM_ADMIN, COMPANY_ADMIN, OPERATOR

    private String companyId;

    private String companyName;

    @Column(nullable = false)
    private String status; // ACTIVE, INACTIVE

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_sites", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "site_id")
    private List<String> siteIds;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
