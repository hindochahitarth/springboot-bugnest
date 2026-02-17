package org.miniproject.bugnest.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class ProjectMemberResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String role;
    private String status;
}
