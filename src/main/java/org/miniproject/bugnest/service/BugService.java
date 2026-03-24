package org.miniproject.bugnest.service;

import org.miniproject.bugnest.dto.*;
import org.miniproject.bugnest.model.*;
import org.miniproject.bugnest.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        return mapAttachmentToResponse(saved);
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

        if (creator.getRole() != Role.ADMIN && 
            !memberRepository.existsByProjectAndUserAndStatus(project, creator, ProjectMemberStatus.ACCEPTED)) {
            throw new RuntimeException("Access denied: Only project members can report bugs");
        }

        Bug bug = new Bug();
        bug.setTitle(request.getTitle());
        bug.setDescription(request.getDescription());
        bug.setPriority(BugPriority.valueOf(request.getPriority().toUpperCase()));
        bug.setStatus(BugStatus.OPEN);
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

        return bugRepository.save(bug);
    }

    @Transactional
    public Bug updateBugStatus(Long bugId, String status, User user) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));

        BugStatus newStatus = BugStatus.valueOf(status.toUpperCase());
        
        // Role-based Status Update Rules
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.PROJECT_MANAGER) {
            bug.setStatus(newStatus);
        } else if (user.getRole() == Role.DEVELOPER) {
            if (newStatus == BugStatus.IN_PROGRESS || newStatus == BugStatus.REVIEW) {
                bug.setStatus(newStatus);
            } else {
                throw new RuntimeException("Developers can only move bugs to In Progress or Review");
            }
        } else if (user.getRole() == Role.TESTER) {
            if (newStatus == BugStatus.TESTING || newStatus == BugStatus.CLOSED) {
                bug.setStatus(newStatus);
            } else if (newStatus == BugStatus.OPEN) {
                if (bug.getStatus() != BugStatus.CLOSED) {
                    throw new RuntimeException("Reopen is only allowed from Closed");
                }
                bug.setStatus(BugStatus.OPEN);
            } else {
                throw new RuntimeException("Testers can only move bugs to Testing, Closed, or Reopen (Open from Closed)");
            }
        }

        return bugRepository.save(bug);
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

        bug.setAssignee(assignee);
        bugRepository.save(bug);
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

        bugRepository.save(bug);
    }

    private BugResponse mapToResponse(Bug bug) {
        return BugResponse.builder()
                .id(bug.getId())
                .bugId(bug.getBugId())
                .title(bug.getTitle())
                .description(bug.getDescription())
                .priority(bug.getPriority().name())
                .status(bug.getStatus().name())
                .projectId(bug.getProject().getId())
                .projectName(bug.getProject().getName())
                .creatorName(bug.getCreator() != null ? bug.getCreator().getName() : "Unknown")
                .assigneeName(bug.getAssignee() != null ? bug.getAssignee().getName() : "Unassigned")
                .assigneeId(bug.getAssignee() != null ? bug.getAssignee().getId() : null)
                .createdAt(bug.getCreatedAt())
                .updatedAt(bug.getUpdatedAt())
                .build();
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
