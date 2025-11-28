package com.dhive.robopilot.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Company {
    private String id;
    private String name;
    private String type;
    private Integer siteCount;
    private Integer robotCount;
    private String contact;
    private String email;
    private String address;
    private Long createdAt;
    private Long updatedAt;
}
