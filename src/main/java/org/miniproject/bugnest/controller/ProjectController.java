package org.miniproject.bugnest.controller;

import org.miniproject.bugnest.dto.*;
import org.miniproject.bugnest.model.*;
import org.miniproject.bugnest.service.ProjectService;
import org.miniproject.bugnest.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody ProjectCreateRequest request) {
        try {
            User creator = getCurrentUser();
            Project project = projectService.createProject(request, creator);
            return ResponseEntity.ok(Map.of("message", "Project created successfully", "project", project));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjects() {
        User user = getCurrentUser();
        return ResponseEntity.ok(projectService.getProjectsForUser(user));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<ProjectMemberResponse>> getMembers(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectMembers(id));
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteMember(@PathVariable Long id, @RequestBody ProjectInviteRequest request) {
        try {
            projectService.inviteMember(id, request);
            return ResponseEntity.ok(Map.of("message", "Invitation sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/invites")
    public ResponseEntity<List<ProjectMemberResponse>> getMyInvites() {
        User user = getCurrentUser();
        return ResponseEntity.ok(projectService.getPendingInvitesForUser(user));
    }

    @PostMapping("/invites/{inviteId}/respond")
    public ResponseEntity<?> respondToInvite(@PathVariable Long inviteId, @RequestParam String status) {
        try {
            User user = getCurrentUser();
            ProjectMemberStatus memberStatus = ProjectMemberStatus.valueOf(status.toUpperCase());
            projectService.respondToInvite(inviteId, memberStatus, user);
            return ResponseEntity.ok(Map.of("message", "Invite " + status.toLowerCase() + "ed successfully"));
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
