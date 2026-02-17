package org.miniproject.bugnest.dto;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;

@Data
@Builder
public class BugResponse {
    private Long id;
    private String bugId;
    private String title;
    private String description;
    private String priority;
    private String status;
    private Long projectId;
    private String projectName;
    private String creatorName;
    private String assigneeName;
    private Long assigneeId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
