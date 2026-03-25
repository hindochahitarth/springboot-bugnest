package org.miniproject.bugnest.controller;

import org.miniproject.bugnest.dto.ProjectMetricsResponse;
import org.miniproject.bugnest.dto.UserMetricsResponse;
import org.miniproject.bugnest.model.Role;
import org.miniproject.bugnest.model.User;
import org.miniproject.bugnest.service.AdminReportService;
import org.miniproject.bugnest.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    @Autowired
    private AdminReportService adminReportService;

    @Autowired
    private UserService userService;

    @GetMapping("/projects")
    public ResponseEntity<?> getProjectMetrics() {
        User user = getCurrentUser();
        if (user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        List<ProjectMetricsResponse> data = adminReportService.getProjectMetrics();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUserMetrics() {
        User user = getCurrentUser();
        if (user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        List<UserMetricsResponse> data = adminReportService.getUserMetrics();
        return ResponseEntity.ok(data);
    }

    @GetMapping(value = "/projects/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportProjectMetricsCsv() {
        User user = getCurrentUser();
        if (user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body("Access denied".getBytes(StandardCharsets.UTF_8));
        }
        String csv = adminReportService.exportProjectMetricsCsv();
        String filename = "bugnest-project-report-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv"))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }

    @GetMapping(value = "/users/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportUserMetricsCsv() {
        User user = getCurrentUser();
        if (user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body("Access denied".getBytes(StandardCharsets.UTF_8));
        }
        String csv = adminReportService.exportUserMetricsCsv();
        String filename = "bugnest-user-report-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv"))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userService.getUserPixel(email);
    }
}

