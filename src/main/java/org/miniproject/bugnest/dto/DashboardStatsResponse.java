package org.miniproject.bugnest.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalProjects;
    private long openBugs;
    private long assignedBugs;
    private long resolvedBugs;
    private long pendingInvites;
}
