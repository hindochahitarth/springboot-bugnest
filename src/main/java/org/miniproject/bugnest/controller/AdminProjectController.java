package org.miniproject.bugnest.controller;

import org.miniproject.bugnest.dto.AdminProjectUpdateRequest;
import org.miniproject.bugnest.dto.ProjectResponse;
import org.miniproject.bugnest.model.Project;
import org.miniproject.bugnest.model.Role;
import org.miniproject.bugnest.model.User;
import org.miniproject.bugnest.service.AdminProjectService;
import org.miniproject.bugnest.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/projects")
public class AdminProjectController {

    @Autowired
    private AdminProjectService adminProjectService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<?> getAllProjects(@RequestParam(required = false, defaultValue = "ALL") String status) {
        User user = getCurrentUser();
        if (user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        List<ProjectResponse> projects = adminProjectService.getAllProjects(status);
        return ResponseEntity.ok(projects);
    }

    @PatchMapping("/{projectId}")
    public ResponseEntity<?> updateProject(@PathVariable Long projectId, @RequestBody AdminProjectUpdateRequest request) {
        User user = getCurrentUser();
        if (user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        try {
            Project updated = adminProjectService.updateProject(projectId, request);
            return ResponseEntity.ok(Map.of("message", "Project updated", "project", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteProject(@PathVariable Long projectId) {
        User user = getCurrentUser();
        if (user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        try {
            adminProjectService.softDeleteProject(projectId);
            return ResponseEntity.ok(Map.of("message", "Project deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userService.getUserPixel(email);
    }
}

