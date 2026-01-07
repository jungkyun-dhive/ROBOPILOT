package com.dhive.robopilot.repository;

import com.dhive.robopilot.model.Mission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MissionRepository extends JpaRepository<Mission, String> {
    List<Mission> findBySiteId(String siteId);
    List<Mission> findBySiteIdIn(List<String> siteIds);
    List<Mission> findByRobotId(String robotId);
    List<Mission> findByStatus(String status);
    List<Mission> findByCompanyId(String companyId);
}
