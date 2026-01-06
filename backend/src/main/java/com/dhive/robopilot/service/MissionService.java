package com.dhive.robopilot.service;

import com.dhive.robopilot.model.Mission;
import com.dhive.robopilot.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MissionService {
    private final MissionRepository missionRepository;

    @Transactional(readOnly = true)
    public List<Mission> getAllMissions() {
        return missionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Mission> getMissionById(String id) {
        return missionRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Mission> getMissionsBySiteId(String siteId) {
        return missionRepository.findBySiteId(siteId);
    }

    @Transactional(readOnly = true)
    public List<Mission> getMissionsByRobotId(String robotId) {
        return missionRepository.findByRobotId(robotId);
    }

    @Transactional(readOnly = true)
    public List<Mission> getMissionsByStatus(String status) {
        return missionRepository.findByStatus(status);
    }

    @Transactional
    public Mission createMission(Mission mission) {
        return missionRepository.save(mission);
    }

    @Transactional
    public Mission updateMission(String id, Mission mission) {
        mission.setId(id);
        return missionRepository.save(mission);
    }

    @Transactional
    public void deleteMission(String id) {
        missionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Mission> getMissionsByCompanyId(String companyId) {
        return missionRepository.findByCompanyId(companyId);
    }
}
