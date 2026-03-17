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

    public List<BugResponse> getBugsByProject(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Security Check: Only members or Admin can view
        if (user.getRole() != Role.ADMIN &&
            !memberRepository.existsByProjectAndUserAndStatus(project, user, ProjectMemberStatus.ACCEPTED)) {
            throw new RuntimeException("Access denied: You are not a member of this project");
        }

        List<Bug> bugs = bugRepository.findByProject(project);

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

        List<Bug> bugs = bugRepository.findByProjectIn(projects);

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
            } else {
                throw new RuntimeException("Testers can only move bugs to Testing or Closed");
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
}
