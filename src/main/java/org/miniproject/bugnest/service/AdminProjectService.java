package org.miniproject.bugnest.service;

import org.miniproject.bugnest.dto.AdminProjectUpdateRequest;
import org.miniproject.bugnest.dto.ProjectResponse;
import org.miniproject.bugnest.model.Project;
import org.miniproject.bugnest.repository.ProjectMemberRepository;
import org.miniproject.bugnest.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AdminProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository memberRepository;

    public List<ProjectResponse> getAllProjects(String status) {
        String filter = status == null ? "ALL" : status.trim().toUpperCase(Locale.ROOT);
        return projectRepository.findAll().stream()
                .filter(p -> {
                    if ("ALL".equals(filter)) return true;
                    String st = normalizeStatus(p.getStatus());
                    return filter.equals(st);
                })
                .map(p -> ProjectResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .description(p.getDescription())
                        .projectKey(p.getProjectKey())
                        .creatorName(p.getCreator() != null ? p.getCreator().getName() : "Unknown")
                        .memberCount(memberRepository.findByProject(p).stream().filter(m -> m.getStatus() != null && "ACCEPTED".equalsIgnoreCase(m.getStatus().name())).count())
                        .userStatus("ADMIN")
                        .status(normalizeStatus(p.getStatus()))
                        .createdAt(p.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public Project updateProject(Long projectId, AdminProjectUpdateRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (request.getName() != null) project.setName(request.getName().trim());
        if (request.getDescription() != null) project.setDescription(request.getDescription());

        if (request.getProjectKey() != null && !request.getProjectKey().isBlank()) {
            String newKey = request.getProjectKey().trim().toUpperCase(Locale.ROOT);
            if (!Objects.equals(newKey, project.getProjectKey())) {
                projectRepository.findByProjectKey(newKey).ifPresent(existing -> {
                    if (!existing.getId().equals(project.getId())) {
                        throw new RuntimeException("Project key '" + newKey + "' already exists.");
                    }
                });
                project.setProjectKey(newKey);
            }
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            project.setStatus(normalizeStatus(request.getStatus()));
        }

        return projectRepository.save(project);
    }

    @Transactional
    public void softDeleteProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        project.setStatus("DELETED");
        projectRepository.save(project);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "ACTIVE";
        return status.trim().toUpperCase(Locale.ROOT);
    }
}

