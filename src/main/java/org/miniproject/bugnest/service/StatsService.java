package org.miniproject.bugnest.service;

import org.miniproject.bugnest.dto.DashboardStatsResponse;
import org.miniproject.bugnest.model.*;
import org.miniproject.bugnest.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class StatsService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository memberRepository;

    @Autowired
    private BugRepository bugRepository;

    public DashboardStatsResponse getStatsForUser(User user) {
        long totalProjects;
        long openBugs;
        long assignedBugs;
        long resolvedBugs;
        long pendingInvites = memberRepository.findByUserAndStatus(user, ProjectMemberStatus.PENDING).size();

        if (user.getRole() == Role.ADMIN) {
            totalProjects = projectRepository.count();
            openBugs = bugRepository.countByStatusNot(BugStatus.CLOSED);
            assignedBugs = bugRepository.countByAssigneeIsNotNull();
            resolvedBugs = bugRepository.countByStatus(BugStatus.CLOSED);
        } else {
            // Stats based on projects the user is part of
            java.util.List<Project> myProjects = memberRepository.findByUser_IdAndStatus(user.getId(), ProjectMemberStatus.ACCEPTED)
                    .stream()
                    .map(ProjectMember::getProject)
                    .collect(java.util.stream.Collectors.toList());

            totalProjects = myProjects.size();
            
            if (myProjects.isEmpty()) {
                openBugs = 0;
                assignedBugs = 0;
                resolvedBugs = 0;
            } else {
                // Bugs in user's projects
                java.util.List<Bug> allMyProjectBugs = bugRepository.findByProjectIn(myProjects);
                
                openBugs = allMyProjectBugs.stream()
                        .filter(b -> b.getStatus() != BugStatus.CLOSED)
                        .count();
                
                // Specifically assigned to this user
                assignedBugs = allMyProjectBugs.stream()
                        .filter(b -> b.getAssignee() != null && b.getAssignee().getId().equals(user.getId()))
                        .count();
                
                resolvedBugs = allMyProjectBugs.stream()
                        .filter(b -> b.getStatus() == BugStatus.CLOSED)
                        .count();
            }
        }

        return DashboardStatsResponse.builder()
                .totalProjects(totalProjects)
                .openBugs(openBugs)
                .assignedBugs(assignedBugs)
                .resolvedBugs(resolvedBugs)
                .pendingInvites(pendingInvites)
                .build();
    }
}
