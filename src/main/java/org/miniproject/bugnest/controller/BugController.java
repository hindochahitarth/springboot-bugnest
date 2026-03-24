package org.miniproject.bugnest.controller;

import org.miniproject.bugnest.dto.BugCreateRequest;
import org.miniproject.bugnest.dto.BugAttachmentRequest;
import org.miniproject.bugnest.dto.BugAttachmentResponse;
import org.miniproject.bugnest.dto.BugCommentRequest;
import org.miniproject.bugnest.dto.BugCommentResponse;
import org.miniproject.bugnest.dto.BugResponse;
import org.miniproject.bugnest.dto.BugActivityResponse;
import org.miniproject.bugnest.dto.PagedResponse;
import org.miniproject.bugnest.model.BugAttachment;
import org.miniproject.bugnest.model.User;
import org.miniproject.bugnest.service.BugService;
import org.miniproject.bugnest.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
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

    @GetMapping("/bugs/paged")
    public ResponseEntity<PagedResponse<BugResponse>> getBugsPaged(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "updatedAt") String sort,
            @RequestParam(defaultValue = "desc") String dir
    ) {
        User user = getCurrentUser();
        Sort.Direction direction = "asc".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
        Page<BugResponse> result = bugService.getPagedBugsForUser(user, projectId, tag, severity, overdue, pageable);
        return ResponseEntity.ok(PagedResponse.<BugResponse>builder()
                .content(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build());
    }

    @GetMapping("/bugs/assigned-to-me")
    public ResponseEntity<List<BugResponse>> getAssignedToMe() {
        User user = getCurrentUser();
        return ResponseEntity.ok(bugService.getAssignedBugsForUser(user));
    }

    @GetMapping("/bugs/{id}")
    public ResponseEntity<BugResponse> getBug(@PathVariable Long id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(bugService.getBugById(id, user));
    }

    @GetMapping("/bugs/{id}/activity")
    public ResponseEntity<List<BugActivityResponse>> getActivity(@PathVariable Long id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(bugService.getBugActivity(id, user));
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

    @PostMapping(value = "/bugs/{id}/attachments/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAttachment(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        try {
            User user = getCurrentUser();
            return ResponseEntity.ok(bugService.uploadAttachment(id, file, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/bugs/{bugId}/attachments/{attachmentId}/download")
    public ResponseEntity<?> downloadAttachment(@PathVariable Long bugId, @PathVariable Long attachmentId) {
        try {
            User user = getCurrentUser();
            BugAttachment attachment = bugService.getAttachmentForDownload(bugId, attachmentId, user);
            Resource resource = new FileSystemResource(attachment.getStoragePath());
            if (!resource.exists()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File not found on server"));
            }

            String filename = attachment.getName() != null ? attachment.getName() : ("attachment-" + attachment.getId());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename.replace("\"", "") + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
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
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status, @RequestParam(required = false) String resolutionNotes) {
        try {
            User user = getCurrentUser();
            bugService.updateBugStatus(id, status, resolutionNotes, user);
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
