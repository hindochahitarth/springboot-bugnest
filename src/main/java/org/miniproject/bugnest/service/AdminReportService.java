package org.miniproject.bugnest.service;

import org.miniproject.bugnest.dto.ProjectMetricsResponse;
import org.miniproject.bugnest.dto.UserMetricsResponse;
import org.miniproject.bugnest.model.*;
import org.miniproject.bugnest.repository.BugRepository;
import org.miniproject.bugnest.repository.ProjectMemberRepository;
import org.miniproject.bugnest.repository.ProjectRepository;
import org.miniproject.bugnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminReportService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository memberRepository;

    @Autowired
    private BugRepository bugRepository;

    @Autowired
    private UserRepository userRepository;

    public List<ProjectMetricsResponse> getProjectMetrics() {
        List<Project> projects = projectRepository.findAll().stream()
                .filter(p -> !"DELETED".equalsIgnoreCase(normalizeStatus(p.getStatus())))
                .collect(Collectors.toList());

        List<Bug> bugs = bugRepository.findAll();
        Map<Long, List<Bug>> bugsByProject = bugs.stream()
                .filter(b -> b.getProject() != null && b.getProject().getId() != null)
                .collect(Collectors.groupingBy(b -> b.getProject().getId()));

        LocalDate today = LocalDate.now();

        List<ProjectMetricsResponse> result = new ArrayList<>();
        for (Project project : projects) {
            List<Bug> projectBugs = bugsByProject.getOrDefault(project.getId(), List.of());
            long total = projectBugs.size();
            long closed = projectBugs.stream().filter(b -> b.getStatus() == BugStatus.CLOSED).count();
            long open = projectBugs.stream().filter(b -> b.getStatus() != BugStatus.CLOSED).count();
            long unassignedOpen = projectBugs.stream().filter(b -> b.getStatus() != BugStatus.CLOSED && b.getAssignee() == null).count();
            long overdueOpen = projectBugs.stream().filter(b -> b.getStatus() != BugStatus.CLOSED && b.getDueDate() != null && b.getDueDate().isBefore(today)).count();
            long criticalOpen = projectBugs.stream().filter(b -> b.getStatus() != BugStatus.CLOSED && (b.getSeverity() == BugSeverity.CRITICAL || b.getSeverity() == BugSeverity.BLOCKER)).count();

            LocalDateTime lastActivityAt = projectBugs.stream()
                    .map(Bug::getUpdatedAt)
                    .filter(Objects::nonNull)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);

            long memberCount = memberRepository.findByProject(project).stream()
                    .filter(m -> m.getStatus() == ProjectMemberStatus.ACCEPTED)
                    .count();

            result.add(ProjectMetricsResponse.builder()
                    .projectId(project.getId())
                    .projectKey(project.getProjectKey())
                    .projectName(project.getName())
                    .status(normalizeStatus(project.getStatus()))
                    .creatorName(project.getCreator() != null ? project.getCreator().getName() : "Unknown")
                    .memberCount(memberCount)
                    .totalBugs(total)
                    .openBugs(open)
                    .closedBugs(closed)
                    .unassignedOpenBugs(unassignedOpen)
                    .overdueOpenBugs(overdueOpen)
                    .criticalOpenBugs(criticalOpen)
                    .lastActivityAt(lastActivityAt)
                    .build());
        }

        result.sort(Comparator.comparing(ProjectMetricsResponse::getProjectName, Comparator.nullsLast(String::compareToIgnoreCase)));
        return result;
    }

    public List<UserMetricsResponse> getUserMetrics() {
        List<User> users = userRepository.findAll();
        List<Bug> bugs = bugRepository.findAll();

        Map<Long, List<Bug>> createdByUser = bugs.stream()
                .filter(b -> b.getCreator() != null && b.getCreator().getId() != null)
                .collect(Collectors.groupingBy(b -> b.getCreator().getId()));

        Map<Long, List<Bug>> assignedByUser = bugs.stream()
                .filter(b -> b.getAssignee() != null && b.getAssignee().getId() != null)
                .collect(Collectors.groupingBy(b -> b.getAssignee().getId()));

        LocalDate today = LocalDate.now();

        List<UserMetricsResponse> result = new ArrayList<>();
        for (User u : users) {
            List<Bug> created = createdByUser.getOrDefault(u.getId(), List.of());
            List<Bug> assigned = assignedByUser.getOrDefault(u.getId(), List.of());

            long assignedOpen = assigned.stream().filter(b -> b.getStatus() != BugStatus.CLOSED).count();
            long assignedClosed = assigned.stream().filter(b -> b.getStatus() == BugStatus.CLOSED).count();
            long assignedOverdue = assigned.stream().filter(b -> b.getStatus() != BugStatus.CLOSED && b.getDueDate() != null && b.getDueDate().isBefore(today)).count();

            result.add(UserMetricsResponse.builder()
                    .userId(u.getId())
                    .name(u.getName())
                    .email(u.getEmail())
                    .role(u.getRole() != null ? u.getRole().name() : null)
                    .status(u.getStatus() != null ? u.getStatus().name() : null)
                    .createdBugs(created.size())
                    .assignedOpenBugs(assignedOpen)
                    .assignedClosedBugs(assignedClosed)
                    .assignedOverdueOpenBugs(assignedOverdue)
                    .build());
        }

        result.sort(Comparator.comparing(UserMetricsResponse::getName, Comparator.nullsLast(String::compareToIgnoreCase)));
        return result;
    }

    public String exportProjectMetricsCsv() {
        List<ProjectMetricsResponse> data = getProjectMetrics();
        StringBuilder sb = new StringBuilder();
        sb.append("projectId,projectKey,projectName,status,creatorName,memberCount,totalBugs,openBugs,closedBugs,unassignedOpenBugs,overdueOpenBugs,criticalOpenBugs,lastActivityAt\n");
        for (ProjectMetricsResponse r : data) {
            sb.append(csv(r.getProjectId()))
                    .append(',').append(csv(r.getProjectKey()))
                    .append(',').append(csv(r.getProjectName()))
                    .append(',').append(csv(r.getStatus()))
                    .append(',').append(csv(r.getCreatorName()))
                    .append(',').append(r.getMemberCount())
                    .append(',').append(r.getTotalBugs())
                    .append(',').append(r.getOpenBugs())
                    .append(',').append(r.getClosedBugs())
                    .append(',').append(r.getUnassignedOpenBugs())
                    .append(',').append(r.getOverdueOpenBugs())
                    .append(',').append(r.getCriticalOpenBugs())
                    .append(',').append(csv(r.getLastActivityAt() != null ? r.getLastActivityAt().toString() : ""))
                    .append('\n');
        }
        return sb.toString();
    }

    public String exportUserMetricsCsv() {
        List<UserMetricsResponse> data = getUserMetrics();
        StringBuilder sb = new StringBuilder();
        sb.append("userId,name,email,role,status,createdBugs,assignedOpenBugs,assignedClosedBugs,assignedOverdueOpenBugs\n");
        for (UserMetricsResponse r : data) {
            sb.append(csv(r.getUserId()))
                    .append(',').append(csv(r.getName()))
                    .append(',').append(csv(r.getEmail()))
                    .append(',').append(csv(r.getRole()))
                    .append(',').append(csv(r.getStatus()))
                    .append(',').append(r.getCreatedBugs())
                    .append(',').append(r.getAssignedOpenBugs())
                    .append(',').append(r.getAssignedClosedBugs())
                    .append(',').append(r.getAssignedOverdueOpenBugs())
                    .append('\n');
        }
        return sb.toString();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "ACTIVE";
        return status.trim().toUpperCase(Locale.ROOT);
    }

    private String csv(Object value) {
        if (value == null) return "";
        String s = String.valueOf(value);
        boolean needsQuote = s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r");
        if (!needsQuote) return s;
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }
}

