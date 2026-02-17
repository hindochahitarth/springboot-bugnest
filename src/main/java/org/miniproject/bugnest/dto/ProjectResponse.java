package org.miniproject.bugnest.dto;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String projectKey;
    private String creatorName;
    private long memberCount;
    private String userStatus; // PENDING, ACCEPTED, etc. for the requesting user
    private LocalDateTime createdAt;
}
