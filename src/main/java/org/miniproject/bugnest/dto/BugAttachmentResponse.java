package org.miniproject.bugnest.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BugAttachmentResponse {
    private Long id;
    private String name;
    private String url;
    private String uploaderName;
    private String uploaderEmail;
    private LocalDateTime createdAt;
}

