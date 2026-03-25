package org.miniproject.bugnest.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProjectMetricsResponse {
    private Long projectId;
    private String projectKey;
    private String projectName;
    private String status;
    private String creatorName;
    private long memberCount;

    private long totalBugs;
    private long openBugs;
    private long closedBugs;
    private long unassignedOpenBugs;
    private long overdueOpenBugs;
    private long criticalOpenBugs; // CRITICAL or BLOCKER

    private LocalDateTime lastActivityAt;
}

