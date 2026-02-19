package org.miniproject.bugnest.service;

import org.miniproject.bugnest.dto.*;
import org.miniproject.bugnest.model.*;
import org.miniproject.bugnest.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository memberRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Project createProject(ProjectCreateRequest request, User creator) {
        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setProjectKey(request.getProjectKey().toUpperCase());
        project.setCreator(creator);
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        
        Project savedProject = projectRepository.save(project);

        // Creator automatically becomes an ACCEPTED member (Manager role for the project)
        ProjectMember member = new ProjectMember();
        member.setProject(savedProject);
        member.setUser(creator);
        member.setRole(Role.PROJECT_MANAGER);
        member.setStatus(ProjectMemberStatus.ACCEPTED);
        member.setJoinedAt(LocalDateTime.now());
        member.setProjectOwner(true);
        memberRepository.save(member);

        return savedProject;
    }

    public List<ProjectResponse> getProjectsForUser(User user) {
        List<Project> projects;
        
        if (user.getRole() == Role.ADMIN) {
            projects = projectRepository.findAll();
        } else {
            // Find projects where user is an ACCEPTED member
            projects = memberRepository.findByUserAndStatus(user, ProjectMemberStatus.ACCEPTED)
                    .stream()
                    .map(ProjectMember::getProject)
                    .collect(Collectors.toList());
        }

        return projects.stream().map(p -> mapToResponse(p, user)).collect(Collectors.toList());
    }

    public List<ProjectMemberResponse> getProjectMembers(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        return memberRepository.findByProject(project).stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void inviteMember(Long projectId, ProjectInviteRequest request, User inviter) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        // Security Check: Only Admin or Project Owner can invite
        ProjectMember inviterMembership = memberRepository.findByProjectAndUser(project, inviter)
                .orElse(null);
        
        boolean isAdmin = inviter.getRole() == Role.ADMIN;
        boolean isOwner = inviterMembership != null && inviterMembership.isProjectOwner();

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("Access Denied: Only project owners or admins can invite members.");
        }

        String email = request.getUserEmail().toLowerCase();
        
        // Role Restriction: Managers can only invite DEVELOPER or TESTER
        if (!isAdmin) {
            String roleStr = request.getRole().toUpperCase();
            if (!roleStr.equals("DEVELOPER") && !roleStr.equals("TESTER")) {
                throw new RuntimeException("Project Managers can only invite DEVELOPERs or TESTERs.");
            }
        }

        // Search for existing user
        Optional<User> targetUser = userRepository.findByEmail(email);
        
        // Check for existing membership/invite
        if (targetUser.isPresent()) {
            Optional<ProjectMember> existingMember = memberRepository.findByProjectAndUser(project, targetUser.get());
            if (existingMember.isPresent()) {
                ProjectMember m = existingMember.get();
                if (m.getStatus() == ProjectMemberStatus.ACCEPTED) {
                    throw new RuntimeException("User is already a member of this project.");
                } else if (m.getStatus() == ProjectMemberStatus.PENDING) {
                    // Update timestamp to "resend"
                    m.setInvitedAt(LocalDateTime.now());
                    m.setInvitedBy(inviter);
                    m.setMessage(request.getMessage());
                    memberRepository.save(m);
                    return;
                } else if (m.getStatus() == ProjectMemberStatus.REJECTED) {
                    // Re-invite
                    m.setStatus(ProjectMemberStatus.PENDING);
                    m.setInvitedAt(LocalDateTime.now());
                    m.setInvitedBy(inviter);
                    m.setMessage(request.getMessage());
                    memberRepository.save(m);
                    return;
                }
            }
        } else {
            // CASE 2: User doesn't exist - invitation by email
            Optional<ProjectMember> existingEmailInvite = memberRepository.findByProjectAndInvitedEmail(project, email);
            if (existingEmailInvite.isPresent()) {
                ProjectMember m = existingEmailInvite.get();
                if (m.getStatus() == ProjectMemberStatus.PENDING) {
                    m.setInvitedAt(LocalDateTime.now());
                    m.setInvitedBy(inviter);
                    m.setMessage(request.getMessage());
                    memberRepository.save(m);
                    return;
                } else if (m.getStatus() == ProjectMemberStatus.REJECTED) {
                    m.setStatus(ProjectMemberStatus.PENDING);
                    m.setInvitedAt(LocalDateTime.now());
                    m.setInvitedBy(inviter);
                    m.setMessage(request.getMessage());
                    memberRepository.save(m);
                    return;
                }
            }
        }

        // Create new invitation
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setInvitedEmail(email);
        member.setUser(targetUser.orElse(null));
        member.setRole(Role.valueOf(request.getRole().toUpperCase()));
        member.setStatus(ProjectMemberStatus.PENDING);
        member.setInvitedBy(inviter);
        member.setInvitedAt(LocalDateTime.now());
        member.setMessage(request.getMessage());
        memberRepository.save(member);
        
        // TODO: Send email notification
    }

    @Transactional
    public void removeMember(Long projectId, Long memberId, User actor) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        ProjectMember memberToRemove = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        // Security Check: Only Admin or Project Owner can remove members
        ProjectMember actorMember = memberRepository.findByProjectAndUser(project, actor)
                .orElse(null);
        
        boolean isAdmin = actor.getRole() == Role.ADMIN;
        boolean isOwner = actorMember != null && actorMember.isProjectOwner();

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("Access Denied: Only project owners or admins can remove members.");
        }

        // Cannot remove the owner themselves unless it's an admin (but usually owner is protected)
        if (memberToRemove.isProjectOwner() && !isAdmin) {
            throw new RuntimeException("Cannot remove the project owner.");
        }

        memberRepository.delete(memberToRemove);
    }

    @Transactional
    public void respondToInvite(Long memberId, ProjectMemberStatus response, User user) {
        ProjectMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        // Only the invited user can respond (if they exist)
        if (member.getUser() != null && !member.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to respond to this invite");
        }
        
        // If it was an email-only invite, ensure current user matches email
        if (member.getUser() == null && !member.getInvitedEmail().equalsIgnoreCase(user.getEmail())) {
            throw new RuntimeException("Unauthorized: This invite was for another email address.");
        }

        if (response == ProjectMemberStatus.ACCEPTED) {
            member.setStatus(ProjectMemberStatus.ACCEPTED);
            member.setUser(user); // Link the user if it was null
            member.setJoinedAt(LocalDateTime.now());
            memberRepository.save(member);
        } else if (response == ProjectMemberStatus.REJECTED) {
            member.setStatus(ProjectMemberStatus.REJECTED);
            memberRepository.save(member);
        }
    }

    public List<ProjectMemberResponse> getPendingInvitesForUser(User user) {
        return memberRepository.findByUserAndStatus(user, ProjectMemberStatus.PENDING)
                .stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList());
    }

    private ProjectResponse mapToResponse(Project project, User user) {
        // Find membership status for this specific user
        String status = "NONE";
        if (user.getRole() == Role.ADMIN) {
            status = "ACCEPTED";
        } else {
            status = memberRepository.findByProjectAndUser(project, user)
                    .map(m -> m.getStatus().name())
                    .orElse("NONE");
        }

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .projectKey(project.getProjectKey())
                .creatorName(project.getCreator().getName())
                .memberCount(memberRepository.findByProject(project).stream()
                        .filter(m -> m.getStatus() == ProjectMemberStatus.ACCEPTED)
                        .count())
                .userStatus(status)
                .status(project.getStatus())
                .createdAt(project.getCreatedAt())
                .build();
    }

    private ProjectMemberResponse mapToMemberResponse(ProjectMember member) {
        return ProjectMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser() != null ? member.getUser().getId() : null)
                .userName(member.getUser() != null ? member.getUser().getName() : "Invited (Not Registered)")
                .userEmail(member.getUser() != null ? member.getUser().getEmail() : member.getInvitedEmail())
                .role(member.getRole().name())
                .status(member.getStatus().name())
                .isProjectOwner(member.isProjectOwner())
                .build();
    }
}
