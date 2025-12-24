package com.dhive.robopilot.service;

import com.dhive.robopilot.model.Robot;
import com.dhive.robopilot.repository.RobotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RobotService {
    private final RobotRepository robotRepository;

    @Transactional(readOnly = true)
    public List<Robot> getAllRobots() {
        return robotRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Robot> getRobotById(String id) {
        return robotRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Robot> getRobotsBySiteId(String siteId) {
        return robotRepository.findBySiteId(siteId);
    }

    @Transactional(readOnly = true)
    public List<Robot> getRobotsByStatus(String status) {
        return robotRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<Robot> getRobotsByType(String type) {
        return robotRepository.findByType(type);
    }

    @Transactional
    public Robot createRobot(Robot robot) {
        return robotRepository.save(robot);
    }

    @Transactional
    public Robot updateRobot(String id, Robot robot) {
        robot.setId(id);
        return robotRepository.save(robot);
    }

    @Transactional
    public void deleteRobot(String id) {
        robotRepository.deleteById(id);
    }
}
