package org.miniproject.bugnest.controller;

import org.miniproject.bugnest.dto.BugCreateRequest;
import org.miniproject.bugnest.dto.BugResponse;
import org.miniproject.bugnest.model.User;
import org.miniproject.bugnest.service.BugService;
import org.miniproject.bugnest.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class BugController {

    @Autowired
    private BugService bugService;

    @Autowired
    private UserService userService;

    @GetMapping("/projects/{projectId}/bugs")
    public ResponseEntity<List<BugResponse>> getBugs(@PathVariable Long projectId) {
        User user = getCurrentUser();
        return ResponseEntity.ok(bugService.getBugsByProject(projectId, user));
    }

    @PostMapping("/bugs")
    public ResponseEntity<?> createBug(@RequestBody BugCreateRequest request) {
        try {
            User creator = getCurrentUser();
            org.miniproject.bugnest.model.Bug bug = bugService.createBug(request, creator);
            return ResponseEntity.ok(Map.of("message", "Bug reported successfully", "bug", bug));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/bugs/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            User user = getCurrentUser();
            bugService.updateBugStatus(id, status, user);
            return ResponseEntity.ok(Map.of("message", "Bug status updated to " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/bugs/{id}/assign")
    public ResponseEntity<?> assignBug(@PathVariable Long id, @RequestParam Long userId) {
        try {
            User manager = getCurrentUser();
            bugService.assignBug(id, userId, manager);
            return ResponseEntity.ok(Map.of("message", "Bug assigned successfully"));
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
