package com.dhive.robopilot.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Mission {
    private String id;
    private String name;
    private String siteId;
    private String siteName;
    private String robotId;
    private String robotName;
    private String type; // PATROL, INSPECTION, DELIVERY, SURVEILLANCE
    private String schedule; // CRON expression or description
    private String status; // PENDING, RUNNING, COMPLETED, FAILED
    private String path; // JSON string of waypoints
    private Long startTime;
    private Long endTime;
    private Long createdAt;
    private Long updatedAt;
}
