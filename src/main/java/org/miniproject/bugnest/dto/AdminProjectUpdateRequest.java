package org.miniproject.bugnest.dto;

import lombok.Data;

@Data
public class AdminProjectUpdateRequest {
    private String name;
    private String description;
    private String projectKey;
    private String status; // ACTIVE, INACTIVE, DELETED
}

