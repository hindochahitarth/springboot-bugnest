package org.miniproject.bugnest.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BugActivityResponse {
    private Long id;
    private String action;
    private String message;
    private String actorName;
    private String actorEmail;
    private LocalDateTime createdAt;
}

