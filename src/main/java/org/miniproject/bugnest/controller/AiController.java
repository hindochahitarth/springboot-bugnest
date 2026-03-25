package org.miniproject.bugnest.controller;

import org.miniproject.bugnest.dto.BugPrioritySuggestionRequest;
import org.miniproject.bugnest.dto.BugPrioritySuggestionResponse;
import org.miniproject.bugnest.service.BugPriorityAiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private BugPriorityAiService bugPriorityAiService;

    @PostMapping("/bugs/suggest-priority")
    public ResponseEntity<?> suggestBugPriority(@RequestBody BugPrioritySuggestionRequest request) {
        if (request == null || request.getTitle() == null || request.getTitle().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
        }
        BugPrioritySuggestionResponse response = bugPriorityAiService.suggest(
                request.getTitle(),
                request.getDescription());
        return ResponseEntity.ok(response);
    }
}
