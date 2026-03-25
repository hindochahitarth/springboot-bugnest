package org.miniproject.bugnest.service;

import org.miniproject.bugnest.dto.*;
import org.miniproject.bugnest.model.*;
import org.miniproject.bugnest.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BugService {

    @Autowired
    private org.miniproject.bugnest.repository.BugRepository bugRepository;

    @Autowired
    private org.miniproject.bugnest.repository.ProjectRepository projectRepository;

    @Autowired
    private org.miniproject.bugnest.repository.ProjectMemberRepository memberRepository;

    @Autowired
    private org.miniproject.bugnest.repository.UserRepository userRepository;

    @Autowired
    private BugCommentRepository bugCommentRepository;

    @Autowired
    private BugAttachmentRepository bugAttachmentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private BugActivityRepository bugActivityRepository;

    public List<BugResponse> getBugsByProject(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Security Check: Only members or Admin can view
        if (user.getRole() != Role.ADMIN &&
            !memberRepository.existsByProjectAndUserAndStatus(project, user, ProjectMemberStatus.ACCEPTED)) {
            throw new RuntimeException("Access denied: You are not a member of this project");
        }

        List<Bug> bugs = bugRepository.findByProjectOrderByUpdatedAtDesc(project);

        // Visibility Rule: Developers and Testers only see bugs assigned to them
        if (user.getRole() == Role.DEVELOPER || user.getRole() == Role.TESTER) {
            bugs = bugs.stream()
                    .filter(b -> b.getAssignee() != null && b.getAssignee().getId().equals(user.getId()))
                    .collect(Collectors.toList());
        }

        return bugs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public BugResponse getBugById(Long id, User user) {
        Bug bug = getAccessibleBug(id, user);
        return mapToResponse(bug);
    }

    public List<BugCommentResponse> getComments(Long bugId, User user) {
        Bug bug = getAccessibleBug(bugId, user);
        return bugCommentRepository.findByBugOrderByCreatedAtAsc(bug).stream()
                .map(this::mapCommentToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BugCommentResponse addComment(Long bugId, BugCommentRequest request, User user) {
        if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            throw new RuntimeException("Comment message is required");
        }

        Bug bug = getAccessibleBug(bugId, user);

        BugComment comment = new BugComment();
        comment.setBug(bug);
        comment.setAuthor(user);
        comment.setMessage(request.getMessage().trim());

        BugComment saved = bugCommentRepository.save(comment);

        // Notify creator/assignee (excluding actor)
        notifyUsersForBug(saved.getBug(), user, "COMMENT",
                user.getName() + " commented on " + saved.getBug().getBugId(),
                "/bugs/" + saved.getBug().getId());

        recordActivity(saved.getBug(), user, "COMMENT_ADDED", user.getName() + " added a comment");

        return mapCommentToResponse(saved);
    }

    public List<BugAttachmentResponse> getAttachments(Long bugId, User user) {
        Bug bug = getAccessibleBug(bugId, user);
        return bugAttachmentRepository.findByBugOrderByCreatedAtAsc(bug).stream()
                .map(this::mapAttachmentToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BugAttachmentResponse addAttachment(Long bugId, BugAttachmentRequest request, User user) {
        if (request == null || request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Attachment name is required");
        }
        if (request.getUrl() == null || request.getUrl().trim().isEmpty()) {
            throw new RuntimeException("Attachment URL is required");
        }

        Bug bug = getAccessibleBug(bugId, user);

        BugAttachment attachment = new BugAttachment();
        attachment.setBug(bug);
        attachment.setUploader(user);
        attachment.setName(request.getName().trim());
        attachment.setUrl(request.getUrl().trim());

        BugAttachment saved = bugAttachmentRepository.save(attachment);

        notifyUsersForBug(saved.getBug(), user, "ATTACHMENT",
                user.getName() + " added an attachment to " + saved.getBug().getBugId(),
                "/bugs/" + saved.getBug().getId());

        recordActivity(saved.getBug(), user, "ATTACHMENT_ADDED", user.getName() + " added an attachment");

        return mapAttachmentToResponse(saved);
    }

    @Transactional
    public BugAttachmentResponse uploadAttachment(Long bugId, MultipartFile file, User user) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }

        Bug bug = getAccessibleBug(bugId, user);

        String original = file.getOriginalFilename();
        String safeName = (original == null || original.isBlank()) ? "attachment" : original.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storedName = System.currentTimeMillis() + "_" + safeName;

        try {
            Path baseDir = Paths.get("uploads", "bug-" + bug.getId()).toAbsolutePath().normalize();
            Files.createDirectories(baseDir);
            Path target = baseDir.resolve(storedName).normalize();

            if (!target.startsWith(baseDir)) {
                throw new RuntimeException("Invalid file path");
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            BugAttachment attachment = new BugAttachment();
            attachment.setBug(bug);
            attachment.setUploader(user);
            attachment.setName(original != null && !original.isBlank() ? original : storedName);
            attachment.setStoragePath(target.toString());
            attachment.setUrl("/api/bugs/" + bug.getId() + "/attachments/" + "PENDING" + "/download");

            BugAttachment saved = bugAttachmentRepository.save(attachment);
            // Fill download link now that ID exists
            saved.setUrl("/api/bugs/" + bug.getId() + "/attachments/" + saved.getId() + "/download");
            saved = bugAttachmentRepository.save(saved);

            notifyUsersForBug(saved.getBug(), user, "ATTACHMENT",
                    user.getName() + " uploaded a file to " + saved.getBug().getBugId(),
                    "/bugs/" + saved.getBug().getId());

            recordActivity(saved.getBug(), user, "ATTACHMENT_ADDED", user.getName() + " uploaded an attachment");

            return mapAttachmentToResponse(saved);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage());
        }
    }

    public BugAttachment getAttachmentForDownload(Long bugId, Long attachmentId, User user) {
        Bug bug = getAccessibleBug(bugId, user);
        BugAttachment attachment = bugAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));
        if (!attachment.getBug().getId().equals(bug.getId())) {
            throw new RuntimeException("Attachment does not belong to this bug");
        }
        if (attachment.getStoragePath() == null || attachment.getStoragePath().isBlank()) {
            throw new RuntimeException("Attachment is not a stored file");
        }
        return attachment;
    }

    public List<BugResponse> getAllBugsForUser(User user) {
        List<Project> projects;
        
        if (user.getRole() == Role.ADMIN) {
            return bugRepository.findAll().stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        // For non-admins, get projects where they are accepted members
        projects = memberRepository.findByUserAndStatus(user, ProjectMemberStatus.ACCEPTED)
                .stream()
                .map(ProjectMember::getProject)
                .collect(Collectors.toList());

        if (projects.isEmpty()) {
            return List.of();
        }

        List<Bug> bugs = bugRepository.findByProjectInOrderByUpdatedAtDesc(projects);

        // Visibility Rule: Developers and Testers only see bugs assigned to them
        if (user.getRole() == Role.DEVELOPER || user.getRole() == Role.TESTER) {
            bugs = bugs.stream()
                    .filter(b -> b.getAssignee() != null && b.getAssignee().getId().equals(user.getId()))
                    .collect(Collectors.toList());
        }

        return bugs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public Bug createBug(BugCreateRequest request, User creator) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (creator.getRole() != Role.ADMIN && project.getStatus() != null &&
                !"ACTIVE".equalsIgnoreCase(project.getStatus().trim())) {
            throw new RuntimeException("Project is not active");
        }

        if (creator.getRole() != Role.ADMIN && 
            !memberRepository.existsByProjectAndUserAndStatus(project, creator, ProjectMemberStatus.ACCEPTED)) {
            throw new RuntimeException("Access denied: Only project members can report bugs");
        }

        Bug bug = new Bug();
        bug.setTitle(request.getTitle());
        bug.setDescription(request.getDescription());
        bug.setPriority(BugPriority.valueOf(request.getPriority().toUpperCase()));
        if (request.getSeverity() != null && !request.getSeverity().isBlank()) {
            bug.setSeverity(BugSeverity.valueOf(request.getSeverity().toUpperCase()));
        } else {
            bug.setSeverity(BugSeverity.MINOR);
        }
        bug.setStatus(BugStatus.OPEN);
        bug.setDueDate(request.getDueDate());
        bug.setTags(normalizeTagsToString(request.getTags()));
        bug.setProject(project);
        bug.setCreator(creator);

        if (request.getAssigneeId() != null && request.getAssigneeId() > 0) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));
            
            // Check if assignee is a member
            if (!memberRepository.existsByProjectAndUserAndStatus(project, assignee, ProjectMemberStatus.ACCEPTED)) {
                throw new RuntimeException("Assignee must be an accepted member of the project");
            }
            bug.setAssignee(assignee);
        }

        // Generate Bug ID (e.g., BNF-1)
        long count = bugRepository.countByProject(project);
        bug.setBugId(project.getProjectKey() + "-" + (count + 1));

        Bug saved = bugRepository.save(bug);
        recordActivity(saved, creator, "BUG_CREATED", creator.getName() + " created " + saved.getBugId());
        if (saved.getAssignee() != null && saved.getAssignee().getId() != null && !saved.getAssignee().getId().equals(creator.getId())) {
            notificationService.create(saved.getAssignee(), "BUG_ASSIGNED",
                    "You were assigned " + saved.getBugId() + " (" + saved.getTitle() + ")",
                    "/bugs/" + saved.getId());
        }
        return saved;
    }

    @Transactional
    public Bug updateBugStatus(Long bugId, String status, String resolutionNotes, User user) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));

        BugStatus oldStatus = bug.getStatus();
        BugStatus newStatus = BugStatus.valueOf(status.toUpperCase());

        if (newStatus == BugStatus.CLOSED) {
            if (resolutionNotes == null || resolutionNotes.trim().length() < 5) {
                throw new RuntimeException("Resolution notes are required to close a bug");
            }
            bug.setResolutionNotes(resolutionNotes.trim());
        }

        assertStatusChangeAllowed(bug, newStatus, user);
        bug.setStatus(newStatus);

        Bug saved = bugRepository.save(bug);
        notifyUsersForBug(saved, user, "BUG_STATUS",
                user.getName() + " moved " + saved.getBugId() + " to " + saved.getStatus().name(),
                "/bugs/" + saved.getId());
        recordActivity(saved, user, "STATUS_CHANGED",
                user.getName() + " changed status from " + (oldStatus != null ? oldStatus.name() : "UNKNOWN") + " to " + saved.getStatus().name());
        return saved;
    }

    @Transactional
    public void assignBug(Long bugId, Long userId, User manager) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));

        if (manager.getRole() != Role.ADMIN && manager.getRole() != Role.PROJECT_MANAGER) {
            throw new RuntimeException("Only Admins and Managers can assign bugs");
        }

        User assignee = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!memberRepository.existsByProjectAndUserAndStatus(bug.getProject(), assignee, ProjectMemberStatus.ACCEPTED)) {
            throw new RuntimeException("Assignee must be a member of the project");
        }

        User oldAssignee = bug.getAssignee();
        bug.setAssignee(assignee);
        Bug saved = bugRepository.save(bug);

        if (assignee.getId() != null && !assignee.getId().equals(manager.getId())) {
            notificationService.create(assignee, "BUG_ASSIGNED",
                    "You were assigned " + bug.getBugId() + " (" + bug.getTitle() + ")",
                    "/bugs/" + bug.getId());
        }

        String oldName = oldAssignee != null ? oldAssignee.getName() : "Unassigned";
        recordActivity(saved, manager, "ASSIGNED", manager.getName() + " assigned bug from " + oldName + " to " + assignee.getName());
    }

    @Transactional
    public void updateBug(Long bugId, BugCreateRequest request, User user) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));

        // Only Admin, Project Manager or Creator can edit
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isProjectManager = user.getRole() == Role.PROJECT_MANAGER && 
                memberRepository.existsByProjectAndUserAndStatus(bug.getProject(), user, ProjectMemberStatus.ACCEPTED);
        boolean isCreator = bug.getCreator().getId().equals(user.getId());

        if (!isAdmin && !isProjectManager && !isCreator) {
            throw new RuntimeException("Access Denied: You don't have permission to edit this bug");
        }

        if (request.getTitle() != null) bug.setTitle(request.getTitle());
        if (request.getDescription() != null) bug.setDescription(request.getDescription());
        if (request.getPriority() != null) bug.setPriority(BugPriority.valueOf(request.getPriority().toUpperCase()));
        if (request.getSeverity() != null && !request.getSeverity().isBlank()) {
            bug.setSeverity(BugSeverity.valueOf(request.getSeverity().toUpperCase()));
        }
        if (request.getDueDate() != null) {
            bug.setDueDate(request.getDueDate());
        }
        if (request.getTags() != null) {
            bug.setTags(normalizeTagsToString(request.getTags()));
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            BugStatus newStatus = BugStatus.valueOf(request.getStatus().toUpperCase());
            if (newStatus == BugStatus.CLOSED) {
                if (request.getResolutionNotes() == null || request.getResolutionNotes().trim().length() < 5) {
                    throw new RuntimeException("Resolution notes are required to close a bug");
                }
                bug.setResolutionNotes(request.getResolutionNotes().trim());
            }
            assertStatusChangeAllowed(bug, newStatus, user);
            bug.setStatus(newStatus);
        }
        
        if (request.getAssigneeId() != null && request.getAssigneeId() > 0) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));
            
            if (!memberRepository.existsByProjectAndUserAndStatus(bug.getProject(), assignee, ProjectMemberStatus.ACCEPTED)) {
                throw new RuntimeException("Assignee must be a member of the project");
            }
            bug.setAssignee(assignee);
        } else {
            // Allow unassigning if ID is null or 0 (standard for "Unassigned")
            bug.setAssignee(null);
        }

        Bug saved = bugRepository.save(bug);
        recordActivity(saved, user, "BUG_UPDATED", user.getName() + " updated bug fields");
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            notifyUsersForBug(saved, user, "BUG_STATUS",
                    user.getName() + " updated " + saved.getBugId() + " to " + saved.getStatus().name(),
                    "/bugs/" + saved.getId());
        }
    }

    public List<BugActivityResponse> getBugActivity(Long bugId, User user) {
        Bug bug = getAccessibleBug(bugId, user);
        return bugActivityRepository.findByBugOrderByCreatedAtDesc(bug).stream()
                .map(this::mapActivityToResponse)
                .collect(Collectors.toList());
    }

    private void recordActivity(Bug bug, User actor, String action, String message) {
        if (bug == null || actor == null) return;
        BugActivity a = new BugActivity();
        a.setBug(bug);
        a.setActor(actor);
        a.setAction(action);
        a.setMessage(message);
        bugActivityRepository.save(a);
    }

    private BugActivityResponse mapActivityToResponse(BugActivity a) {
        return BugActivityResponse.builder()
                .id(a.getId())
                .action(a.getAction())
                .message(a.getMessage())
                .actorName(a.getActor() != null ? a.getActor().getName() : "Unknown")
                .actorEmail(a.getActor() != null ? a.getActor().getEmail() : "Unknown")
                .createdAt(a.getCreatedAt())
                .build();
    }

    public List<BugResponse> getAssignedBugsForUser(User user) {
        List<Bug> bugs;
        if (user.getRole() == Role.ADMIN) {
            bugs = bugRepository.findByAssigneeOrderByUpdatedAtDesc(user);
        } else {
            // Ensure bug is in one of the user's accepted projects (defense-in-depth)
            List<Project> myProjects = memberRepository.findByUser_IdAndStatus(user.getId(), ProjectMemberStatus.ACCEPTED)
                    .stream()
                    .map(ProjectMember::getProject)
                    .collect(Collectors.toList());
            if (myProjects.isEmpty()) return List.of();

            bugs = bugRepository.findByAssigneeOrderByUpdatedAtDesc(user).stream()
                    .filter(b -> myProjects.stream().anyMatch(p -> p.getId().equals(b.getProject().getId())))
                    .collect(Collectors.toList());
        }

        return bugs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private void notifyUsersForBug(Bug bug, User actor, String type, String message, String link) {
        if (bug.getCreator() != null && (actor == null || !bug.getCreator().getId().equals(actor.getId()))) {
            notificationService.create(bug.getCreator(), type, message, link);
        }
        if (bug.getAssignee() != null && (actor == null || !bug.getAssignee().getId().equals(actor.getId()))) {
            notificationService.create(bug.getAssignee(), type, message, link);
        }
    }

    private void assertStatusChangeAllowed(Bug bug, BugStatus newStatus, User user) {
        // Admin/PM can move freely (but PM must be a member)
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (user.getRole() == Role.PROJECT_MANAGER) {
            if (!memberRepository.existsByProjectAndUserAndStatus(bug.getProject(), user, ProjectMemberStatus.ACCEPTED)) {
                throw new RuntimeException("Access denied: You are not a member of this project");
            }
            return;
        }

        if (user.getRole() == Role.DEVELOPER) {
            if (newStatus == BugStatus.IN_PROGRESS || newStatus == BugStatus.REVIEW) {
                return;
            }
            throw new RuntimeException("Developers can only move bugs to In Progress or Review");
        }

        if (user.getRole() == Role.TESTER) {
            if (newStatus == BugStatus.TESTING || newStatus == BugStatus.CLOSED) {
                return;
            }
            if (newStatus == BugStatus.OPEN) {
                if (bug.getStatus() != BugStatus.CLOSED) {
                    throw new RuntimeException("Reopen is only allowed from Closed");
                }
                return;
            }
            throw new RuntimeException("Testers can only move bugs to Testing, Closed, or Reopen (Open from Closed)");
        }
    }

    private BugResponse mapToResponse(Bug bug) {
        return BugResponse.builder()
                .id(bug.getId())
                .bugId(bug.getBugId())
                .title(bug.getTitle())
                .description(bug.getDescription())
                .priority(bug.getPriority().name())
                .severity(bug.getSeverity() != null ? bug.getSeverity().name() : BugSeverity.MINOR.name())
                .status(bug.getStatus().name())
                .tags(parseTags(bug.getTags()))
                .dueDate(bug.getDueDate())
                .resolutionNotes(bug.getResolutionNotes())
                .projectId(bug.getProject().getId())
                .projectName(bug.getProject().getName())
                .creatorName(bug.getCreator() != null ? bug.getCreator().getName() : "Unknown")
                .assigneeName(bug.getAssignee() != null ? bug.getAssignee().getName() : "Unassigned")
                .assigneeId(bug.getAssignee() != null ? bug.getAssignee().getId() : null)
                .createdAt(bug.getCreatedAt())
                .updatedAt(bug.getUpdatedAt())
                .build();
    }

    public Page<BugResponse> getPagedBugsForUser(User user, Long projectId, String tag, String severity, Boolean overdue, Pageable pageable) {
        Specification<Bug> spec = Specification.where((Specification<Bug>) null);

        if (projectId != null) {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found"));

            if (user.getRole() != Role.ADMIN &&
                !memberRepository.existsByProjectAndUserAndStatus(project, user, ProjectMemberStatus.ACCEPTED)) {
                throw new RuntimeException("Access denied: You are not a member of this project");
            }
            spec = spec.and(BugSpecifications.projectEquals(project));
        } else {
            if (user.getRole() != Role.ADMIN) {
                List<Project> projects = memberRepository.findByUser_IdAndStatus(user.getId(), ProjectMemberStatus.ACCEPTED)
                        .stream()
                        .map(ProjectMember::getProject)
                        .collect(Collectors.toList());
                if (projects.isEmpty()) {
                    return Page.empty(pageable);
                }
                spec = spec.and(BugSpecifications.projectIn(projects));
            }
        }

        // Visibility Rule: Developers and Testers only see bugs assigned to them
        if (user.getRole() == Role.DEVELOPER || user.getRole() == Role.TESTER) {
            spec = spec.and(BugSpecifications.assigneeEquals(user));
        }

        if (severity != null && !severity.isBlank()) {
            spec = spec.and(BugSpecifications.severityEquals(BugSeverity.valueOf(severity.toUpperCase())));
        }
        if (tag != null && !tag.isBlank()) {
            spec = spec.and(BugSpecifications.tagEquals(tag));
        }
        if (overdue != null && overdue) {
            spec = spec.and(BugSpecifications.overdueOnly(java.time.LocalDate.now()));
        }

        return bugRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    private List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return java.util.Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    private String normalizeTagsToString(List<String> tags) {
        if (tags == null) return null;
        return tags.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(s -> s.trim().toLowerCase(java.util.Locale.ROOT))
                .distinct()
                .collect(Collectors.joining(","));
    }

    private BugCommentResponse mapCommentToResponse(BugComment comment) {
        return BugCommentResponse.builder()
                .id(comment.getId())
                .message(comment.getMessage())
                .authorName(comment.getAuthor() != null ? comment.getAuthor().getName() : "Unknown")
                .authorEmail(comment.getAuthor() != null ? comment.getAuthor().getEmail() : "Unknown")
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private BugAttachmentResponse mapAttachmentToResponse(BugAttachment attachment) {
        return BugAttachmentResponse.builder()
                .id(attachment.getId())
                .name(attachment.getName())
                .url(attachment.getUrl())
                .uploaderName(attachment.getUploader() != null ? attachment.getUploader().getName() : "Unknown")
                .uploaderEmail(attachment.getUploader() != null ? attachment.getUploader().getEmail() : "Unknown")
                .createdAt(attachment.getCreatedAt())
                .build();
    }

    private Bug getAccessibleBug(Long bugId, User user) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));

        if (user.getRole() == Role.ADMIN) {
            return bug;
        }

        boolean isProjectMember = memberRepository.existsByProjectAndUserAndStatus(
                bug.getProject(), user, ProjectMemberStatus.ACCEPTED);
        if (!isProjectMember) {
            throw new RuntimeException("Access denied: You are not a member of this project");
        }

        if (user.getRole() == Role.DEVELOPER || user.getRole() == Role.TESTER) {
            if (bug.getAssignee() == null || !bug.getAssignee().getId().equals(user.getId())) {
                throw new RuntimeException("Access denied: You can only access bugs assigned to you");
            }
        }

        return bug;
    }
}
