package com.dhive.robopilot.repository;

import com.dhive.robopilot.model.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteRepository extends JpaRepository<Site, String> {
    List<Site> findByCompanyId(String companyId);
    List<Site> findByIdIn(List<String> ids);
    List<Site> findByStatus(String status);
}
