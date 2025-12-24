package com.dhive.robopilot.service;

import com.dhive.robopilot.model.Site;
import com.dhive.robopilot.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SiteService {
    private final SiteRepository siteRepository;

    @Transactional(readOnly = true)
    public List<Site> getAllSites() {
        return siteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Site> getSiteById(String id) {
        return siteRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Site> getSitesByCompanyId(String companyId) {
        return siteRepository.findByCompanyId(companyId);
    }

    @Transactional(readOnly = true)
    public List<Site> getSitesByStatus(String status) {
        return siteRepository.findByStatus(status);
    }

    @Transactional
    public Site createSite(Site site) {
        return siteRepository.save(site);
    }

    @Transactional
    public Site updateSite(String id, Site site) {
        site.setId(id);
        return siteRepository.save(site);
    }

    @Transactional
    public void deleteSite(String id) {
        siteRepository.deleteById(id);
    }
}
