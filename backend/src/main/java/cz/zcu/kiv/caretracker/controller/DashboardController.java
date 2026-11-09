package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.dashboard.DashboardDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.DashboardView;
import cz.zcu.kiv.caretracker.service.DashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for dashboard data, providing role-specific statistics and recent activity.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private static final Logger log = LoggerFactory.getLogger(DashboardController.class);

    @Autowired
    private DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<DashboardDTO> getDashboard(@RequestParam(required = false) String view) {
        log.info("Fetching dashboard data");
        return ResponseEntity.ok(dashboardService.getDashboard(parseView(view)));
    }

    /** Unknown values (old bookmarks, edited URLs) fall back to the default view like views the role may not see. */
    private static DashboardView parseView(String view) {
        if (view == null) {
            return null;
        }
        try {
            return DashboardView.valueOf(view);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
