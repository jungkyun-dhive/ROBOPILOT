package com.dhive.robopilot.controller;

import com.dhive.robopilot.model.Mission;
import com.dhive.robopilot.service.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missions")
@RequiredArgsConstructor
public class MissionController {
    private final MissionService missionService;

    @GetMapping
    public ResponseEntity<List<Mission>> getAllMissions() {
        return ResponseEntity.ok(missionService.getAllMissions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Mission> getMissionById(@PathVariable String id) {
        return missionService.getMissionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<Mission>> getMissionsBySiteId(@PathVariable String siteId) {
        return ResponseEntity.ok(missionService.getMissionsBySiteId(siteId));
    }

    @GetMapping("/robot/{robotId}")
    public ResponseEntity<List<Mission>> getMissionsByRobotId(@PathVariable String robotId) {
        return ResponseEntity.ok(missionService.getMissionsByRobotId(robotId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Mission>> getMissionsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(missionService.getMissionsByStatus(status));
    }

    @PostMapping
    public ResponseEntity<Mission> createMission(@RequestBody Mission mission) {
        Mission created = missionService.createMission(mission);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Mission> updateMission(@PathVariable String id, @RequestBody Mission mission) {
        Mission updated = missionService.updateMission(id, mission);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMission(@PathVariable String id) {
        missionService.deleteMission(id);
        return ResponseEntity.noContent().build();
    }
}
