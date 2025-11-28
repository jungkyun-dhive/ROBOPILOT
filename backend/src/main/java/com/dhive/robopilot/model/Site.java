package com.dhive.robopilot.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Site {
    private String id;
    private String name;
    private String companyId;
    private String companyName;
    private String location;
    private String manager;
    private String contact;
    private Double latitude;
    private Double longitude;
    private String status; // ACTIVE, INACTIVE
    private Long createdAt;
    private Long updatedAt;
}
