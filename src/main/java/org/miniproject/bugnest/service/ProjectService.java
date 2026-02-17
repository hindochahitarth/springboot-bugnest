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
        
        Project savedProject = projectRepository.save(project);

        // Creator automatically becomes an ACCEPTED member (Manager role for the project)
        ProjectMember member = new ProjectMember();
        member.setProject(savedProject);
        member.setUser(creator);
        member.setRole(Role.MANAGER);
        member.setStatus(ProjectMemberStatus.ACCEPTED);
        member.setJoinedAt(LocalDateTime.now());
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
    public void inviteMember(Long projectId, ProjectInviteRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        User user = userRepository.findByEmail(request.getUserEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (memberRepository.findByProjectAndUser(project, user).isPresent()) {
            throw new RuntimeException("User is already a member or has a pending invite");
        }

        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        member.setRole(Role.valueOf(request.getRole().toUpperCase()));
        member.setStatus(ProjectMemberStatus.PENDING);
        memberRepository.save(member);
        
        // TODO: Send notification/email
    }

    @Transactional
    public void respondToInvite(Long memberId, ProjectMemberStatus response, User user) {
        ProjectMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        if (!member.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to respond to this invite");
        }

        if (response == ProjectMemberStatus.ACCEPTED) {
            member.setStatus(ProjectMemberStatus.ACCEPTED);
            member.setJoinedAt(LocalDateTime.now());
            memberRepository.save(member);
        } else if (response == ProjectMemberStatus.REJECTED) {
            memberRepository.delete(member);
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
                .createdAt(project.getCreatedAt())
                .build();
    }

    private ProjectMemberResponse mapToMemberResponse(ProjectMember member) {
        return ProjectMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .userName(member.getUser().getName())
                .userEmail(member.getUser().getEmail())
                .role(member.getRole().name())
                .status(member.getStatus().name())
                .build();
    }
}
