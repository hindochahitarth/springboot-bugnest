package org.miniproject.bugnest.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserMetricsResponse {
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String status;

    private long createdBugs;
    private long assignedOpenBugs;
    private long assignedClosedBugs;
    private long assignedOverdueOpenBugs;
}

