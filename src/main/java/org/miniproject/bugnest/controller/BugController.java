package org.miniproject.bugnest.controller;

import org.miniproject.bugnest.dto.BugCreateRequest;
import org.miniproject.bugnest.dto.BugAttachmentRequest;
import org.miniproject.bugnest.dto.BugAttachmentResponse;
import org.miniproject.bugnest.dto.BugCommentRequest;
import org.miniproject.bugnest.dto.BugCommentResponse;
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

    @GetMapping("/bugs")
    public ResponseEntity<List<BugResponse>> getAllBugs() {
        User user = getCurrentUser();
        return ResponseEntity.ok(bugService.getAllBugsForUser(user));
    }

    @GetMapping("/bugs/{id}")
    public ResponseEntity<BugResponse> getBug(@PathVariable Long id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(bugService.getBugById(id, user));
    }

    @GetMapping("/bugs/{id}/comments")
    public ResponseEntity<List<BugCommentResponse>> getComments(@PathVariable Long id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(bugService.getComments(id, user));
    }

    @PostMapping("/bugs/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody BugCommentRequest request) {
        try {
            User user = getCurrentUser();
            return ResponseEntity.ok(bugService.addComment(id, request, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/bugs/{id}/attachments")
    public ResponseEntity<List<BugAttachmentResponse>> getAttachments(@PathVariable Long id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(bugService.getAttachments(id, user));
    }

    @PostMapping("/bugs/{id}/attachments")
    public ResponseEntity<?> addAttachment(@PathVariable Long id, @RequestBody BugAttachmentRequest request) {
        try {
            User user = getCurrentUser();
            return ResponseEntity.ok(bugService.addAttachment(id, request, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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

    @PutMapping("/bugs/{id}")
    public ResponseEntity<?> updateBug(@PathVariable Long id, @RequestBody BugCreateRequest request) {
        try {
            User user = getCurrentUser();
            bugService.updateBug(id, request, user);
            return ResponseEntity.ok(Map.of("message", "Bug updated successfully"));
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
