package com.dhive.robopilot.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Robot {
    private String id;
    private String name;
    private String type; // DRONE, ROBOT
    private String model; // DJI_MATRICE_4E, UNITREE_GO2
    private String siteId;
    private String siteName;
    private String status; // ONLINE, OFFLINE, MISSION, CHARGING
    private Integer batteryLevel;
    private Double latitude;
    private Double longitude;
    private Double altitude;
    private Double speed;
    private String streamUrl;
    private Long lastHeartbeat;
    private Long createdAt;
    private Long updatedAt;
}
