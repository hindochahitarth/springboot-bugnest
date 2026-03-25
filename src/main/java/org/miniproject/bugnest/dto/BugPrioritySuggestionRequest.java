package org.miniproject.bugnest.dto;

import lombok.Data;

@Data
public class BugPrioritySuggestionRequest {
    private String title;
    private String description;
}
