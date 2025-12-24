package com.dhive.robopilot.controller;

import com.dhive.robopilot.model.Robot;
import com.dhive.robopilot.service.RobotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/robots")
@RequiredArgsConstructor
public class RobotController {
    private final RobotService robotService;

    @GetMapping
    public ResponseEntity<List<Robot>> getAllRobots() {
        return ResponseEntity.ok(robotService.getAllRobots());
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
