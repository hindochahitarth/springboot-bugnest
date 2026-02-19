package org.miniproject.bugnest.dto;

import lombok.Data;

@Data
public class ProjectCreateRequest {
    private String name;
    private String description;
    private String projectKey;
    private String status;
}
