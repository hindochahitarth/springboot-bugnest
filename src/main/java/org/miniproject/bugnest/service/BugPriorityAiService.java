package org.miniproject.bugnest.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.miniproject.bugnest.dto.BugPrioritySuggestionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Locale;
import java.util.Set;

@Service
public class BugPriorityAiService {

    private static final Set<String> VALID = Set.of("LOW", "MEDIUM", "HIGH", "HIGHEST");

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();

    @Value("${app.ai.openai.api-key:}")
    private String apiKey;

    @Value("${app.ai.openai.base-url:https://api.openai.com}")
    private String baseUrl;

    @Value("${app.ai.openai.model:gpt-4o-mini}")
    private String model;

    public BugPrioritySuggestionResponse suggest(String title, String description) {
        String t = title == null ? "" : title.trim();
        String d = description == null ? "" : description.trim();
        if (t.isEmpty()) {
            return heuristicSuggest(t, d);
        }
        if (apiKey == null || apiKey.isBlank()) {
            return heuristicSuggest(t, d);
        }
        try {
            return callLlm(t, d);
        } catch (Exception e) {
            return heuristicSuggest(t, d);
        }
    }

    private BugPrioritySuggestionResponse callLlm(String title, String description) throws Exception {
        String endpoint = baseUrl.endsWith("/") ? baseUrl + "v1/chat/completions" : baseUrl + "/v1/chat/completions";

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("temperature", 0.2);
        ArrayNode messages = body.putArray("messages");
        ObjectNode system = messages.addObject();
        system.put("role", "system");
        system.put("content",
                "You classify bug reports for triage. Reply with ONLY a JSON object (no markdown) with keys: "
                        + "\"priority\" (one of LOW, MEDIUM, HIGH, HIGHEST) and \"reason\" (one short sentence). "
                        + "Use HIGHEST for production outages, security issues, data loss, or payment/auth total failure. "
                        + "If the user would say \"critical\", use HIGHEST (the product uses HIGHEST, not CRITICAL).");
        ObjectNode user = messages.addObject();
        user.put("role", "user");
        user.put("content", "Title: " + title + "\nDescription: " + (description.isEmpty() ? "(none)" : description));

        String raw = restClient.post()
                .uri(endpoint)
                .header("Authorization", "Bearer " + apiKey.trim())
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(body))
                .retrieve()
                .body(String.class);

        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("empty LLM response");
        }

        JsonNode root = objectMapper.readTree(raw);
        String content = root.path("choices").path(0).path("message").path("content").asText("");
        if (content.isBlank()) {
            throw new IllegalArgumentException("no message content");
        }

        String json = extractJsonObject(content.trim());
        JsonNode parsed = objectMapper.readTree(json);
        String priority = normalizePriority(parsed.path("priority").asText("MEDIUM"));
        String reason = parsed.path("reason").asText("Suggested from title and description.");

        return BugPrioritySuggestionResponse.builder()
                .priority(priority)
                .reason(reason)
                .source("llm")
                .build();
    }

    /** Allow model to wrap JSON in whitespace or accidental fences. */
    private static String extractJsonObject(String content) {
        int start = content.indexOf('{');
        int end = content.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return content.substring(start, end + 1);
        }
        return content;
    }

    private String normalizePriority(String raw) {
        if (raw == null) {
            return "MEDIUM";
        }
        String p = raw.trim().toUpperCase(Locale.ROOT);
        if ("CRITICAL".equals(p)) {
            return "HIGHEST";
        }
        if (VALID.contains(p)) {
            return p;
        }
        return "MEDIUM";
    }

    private BugPrioritySuggestionResponse heuristicSuggest(String title, String description) {
        String text = (title + " " + description).toLowerCase(Locale.ROOT);

        // HIGHEST keywords: severe production, security, or irreversible data-loss issues.
        if (matches(text,
                "outage", "production down", "production outage", "service down", "server down", "site down", "503",
                "data loss", "complete data loss", "data wiped", "database wiped",
                "security", "security issue", "security issues", "security vulnerability", "vulnerability", "breach",
                "unauthorized", "unauthorized access", "unauthenticated", "permission denied",
                "cannot log in", "cannot login", "login failed", "login broken", "login broken for all",
                "ransomware",
                "payment failed for everyone", "payment failed for all", "charge failed", "checkout failed",
                "token invalid", "jwt invalid",
                "data exposed", "data leak", "information leak", "exfiltration",
                "critical")) {
            return BugPrioritySuggestionResponse.builder()
                    .priority("HIGHEST")
                    .reason("Heuristic: severe production, security, or data-loss signals.")
                    .source("heuristic")
                    .build();
        }
        if (matches(text, "crash", "blocker", "regression", "payment", "checkout",
                "authentication", "memory leak", "deadlock")) {
            return BugPrioritySuggestionResponse.builder()
                    .priority("HIGH")
                    .reason("Heuristic: high-impact or blocking keywords.")
                    .source("heuristic")
                    .build();
        }
        // LOW keywords: cosmetic/UI alignment/color/wording issues.
        if (matches(text,
                "typo",
                "cosmetic", "minor ui", "nitpick", "minor", "small issue",
                "spacing", "alignment", "misaligned", "misalignment",
                "padding", "margin", "font", "color", "colour",
                "button color", "button colour",
                "copy text", "wording", "label",
                "visual")) {
            return BugPrioritySuggestionResponse.builder()
                    .priority("LOW")
                    .reason("Heuristic: cosmetic or minor wording issues.")
                    .source("heuristic")
                    .build();
        }
        return BugPrioritySuggestionResponse.builder()
                .priority("MEDIUM")
                .reason("Heuristic: default when no strong signals.")
                .source("heuristic")
                .build();
    }

    private static boolean matches(String text, String... needles) {
        for (String n : needles) {
            if (text.contains(n)) {
                return true;
            }
        }
        return false;
    }
}
