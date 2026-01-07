package com.dhive.robopilot.service;

import com.dhive.robopilot.model.AuditLog;
import com.dhive.robopilot.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsByUserId(String userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsByCompanyId(String companyId) {
        return auditLogRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
    }

    @Transactional
    public AuditLog createAuditLog(AuditLog auditLog) {
        return auditLogRepository.save(auditLog);
    }
}
