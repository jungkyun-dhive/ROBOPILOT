package com.dhive.robopilot.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private String id;
    private String username;
    private String password;
    private String name;
    private String email;
    private String role; // ADMIN, OPERATOR, USER
    private String company;
    private String status; // ACTIVE, INACTIVE
    private Long createdAt;
    private Long updatedAt;
}
