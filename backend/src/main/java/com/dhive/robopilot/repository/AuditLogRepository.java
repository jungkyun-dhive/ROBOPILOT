package com.dhive.robopilot.repository;

import com.dhive.robopilot.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(String userId);
    List<AuditLog> findByCompanyIdOrderByCreatedAtDesc(String companyId);
    List<AuditLog> findAllByOrderByCreatedAtDesc();
}
