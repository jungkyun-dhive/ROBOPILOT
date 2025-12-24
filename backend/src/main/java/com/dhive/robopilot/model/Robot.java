package com.dhive.robopilot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "robots")
public class Robot {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // DRONE, ROBOT

    @Column(nullable = false)
    private String model; // DJI_MATRICE_4E, UNITREE_GO2

    @Column(nullable = false)
    private String companyId;

    private String companyName;

    @Column(nullable = false)
    private String siteId;

    private String siteName;

    @Column(nullable = false)
    private String status; // ONLINE, OFFLINE, MISSION, CHARGING

    private Integer batteryLevel;
    private Double latitude;
    private Double longitude;
    private Double altitude;
    private Double speed;
    private String streamUrl;
    private LocalDateTime lastHeartbeat;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
