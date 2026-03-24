package org.miniproject.bugnest.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class BugCreateRequest {
    private String title;
    private String description;
    private String priority; // LOW, MEDIUM, HIGH, HIGHEST
    private String severity; // MINOR, MAJOR, BLOCKER, CRITICAL
    private String status; // optional: OPEN, IN_PROGRESS, REVIEW, TESTING, CLOSED
    private List<String> tags;
    private LocalDate dueDate;
    private String resolutionNotes;
    private Long projectId;
    private Long assigneeId;
}
