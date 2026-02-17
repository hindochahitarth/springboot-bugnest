package org.miniproject.bugnest.dto;

import lombok.Data;

@Data
public class BugCreateRequest {
    private String title;
    private String description;
    private String priority; // LOW, MEDIUM, HIGH, HIGHEST
    private Long projectId;
    private Long assigneeId;
}
