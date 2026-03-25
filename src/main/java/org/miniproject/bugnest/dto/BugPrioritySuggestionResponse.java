package org.miniproject.bugnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BugPrioritySuggestionResponse {
    /** One of LOW, MEDIUM, HIGH, HIGHEST (CRITICAL from models maps to HIGHEST). */
    private String priority;
    private String reason;
    /** "llm" or "heuristic" */
    private String source;
}
