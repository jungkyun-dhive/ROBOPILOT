package com.dhive.robopilot.repository;

import com.dhive.robopilot.model.Robot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RobotRepository extends JpaRepository<Robot, String> {
    List<Robot> findBySiteId(String siteId);
    List<Robot> findByStatus(String status);
    List<Robot> findByType(String type);
    List<Robot> findByCompanyId(String companyId);
}
