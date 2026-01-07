package com.dhive.robopilot.controller;

import com.dhive.robopilot.model.Robot;
import com.dhive.robopilot.model.User;
import com.dhive.robopilot.service.RobotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/robots")
@RequiredArgsConstructor
public class RobotController {
    private final RobotService robotService;

    @GetMapping
    public ResponseEntity<List<Robot>> getAllRobots() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User currentUser = (User) authentication.getPrincipal();

        // SYSTEM_ADMIN can see all robots
        if ("SYSTEM_ADMIN".equals(currentUser.getRole())) {
            return ResponseEntity.ok(robotService.getAllRobots());
        }

        // OPERATOR can only see robots from their assigned sites
        if ("OPERATOR".equals(currentUser.getRole())) {
            if (currentUser.getSiteIds() != null && !currentUser.getSiteIds().isEmpty()) {
                return ResponseEntity.ok(robotService.getRobotsBySiteIds(currentUser.getSiteIds()));
            }
            return ResponseEntity.ok(List.of());
        }

        // COMPANY_ADMIN can see all robots from their company
        if (currentUser.getCompanyId() != null) {
            return ResponseEntity.ok(robotService.getRobotsByCompanyId(currentUser.getCompanyId()));
        }

        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Robot> getRobotById(@PathVariable String id) {
        return robotService.getRobotById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<Robot>> getRobotsBySiteId(@PathVariable String siteId) {
        return ResponseEntity.ok(robotService.getRobotsBySiteId(siteId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Robot>> getRobotsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(robotService.getRobotsByStatus(status));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Robot>> getRobotsByType(@PathVariable String type) {
        return ResponseEntity.ok(robotService.getRobotsByType(type));
    }

    @PostMapping
    public ResponseEntity<Robot> createRobot(@RequestBody Robot robot) {
        Robot created = robotService.createRobot(robot);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Robot> updateRobot(@PathVariable String id, @RequestBody Robot robot) {
        Robot updated = robotService.updateRobot(id, robot);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRobot(@PathVariable String id) {
        robotService.deleteRobot(id);
        return ResponseEntity.noContent().build();
    }
}
