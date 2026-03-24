package org.miniproject.bugnest.dto;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class BugResponse {
    private Long id;
    private String bugId;
    private String title;
    private String description;
    private String priority;
    private String severity;
    private String status;
    private List<String> tags;
    private LocalDate dueDate;
    private String resolutionNotes;
    private Long projectId;
    private String projectName;
    private String creatorName;
    private String assigneeName;
    private Long assigneeId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
