package org.miniproject.bugnest.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BugCommentResponse {
    private Long id;
    private String message;
    private String authorName;
    private String authorEmail;
    private LocalDateTime createdAt;
}

