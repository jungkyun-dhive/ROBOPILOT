package com.dhive.robopilot.controller;

import com.dhive.robopilot.model.Site;
import com.dhive.robopilot.service.SiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sites")
@RequiredArgsConstructor
public class SiteController {
    private final SiteService siteService;

    @GetMapping
    public ResponseEntity<List<Site>> getAllSites() {
        return ResponseEntity.ok(siteService.getAllSites());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Site> getSiteById(@PathVariable String id) {
        return siteService.getSiteById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Site>> getSitesByCompanyId(@PathVariable String companyId) {
        return ResponseEntity.ok(siteService.getSitesByCompanyId(companyId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Site>> getSitesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(siteService.getSitesByStatus(status));
    }

    @PostMapping
    public ResponseEntity<Site> createSite(@RequestBody Site site) {
        Site created = siteService.createSite(site);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Site> updateSite(@PathVariable String id, @RequestBody Site site) {
        Site updated = siteService.updateSite(id, site);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSite(@PathVariable String id) {
        siteService.deleteSite(id);
        return ResponseEntity.noContent().build();
    }
}
