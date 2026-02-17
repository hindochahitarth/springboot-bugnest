package org.miniproject.bugnest.dto;

import lombok.Data;

@Data
public class ProjectInviteRequest {
    private String userEmail;
    private String role;
}
