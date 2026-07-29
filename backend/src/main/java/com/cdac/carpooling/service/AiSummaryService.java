package com.cdac.carpooling.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.cdac.carpooling.model.Rating;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class AiSummaryService {

    private static final int MAX_REVIEWS = 10;
    private static final String MODEL = "claude-haiku-4-5-20251001";

    private final RestClient restClient;

    @Value("${anthropic.api.key:}")
    private String apiKey;

    public AiSummaryService() {
        this.restClient = RestClient.create("https://api.anthropic.com/v1/messages");
    }

    /**
     * Generates a 1-2 sentence reputation summary from a user's collected review
     * text. Returns null (no HTTP call attempted) when no API key is configured
     * or there is no review text to summarize, so callers can silently fall back
     * to a rule-based summary - this must never throw or block a rating submission.
     */
    public String generateSummary(List<Rating> ratings) {
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }

        List<String> reviews = ratings.stream()
                .map(Rating::getTextReview)
                .filter(text -> text != null && !text.isBlank())
                .limit(MAX_REVIEWS)
                .toList();

        if (reviews.isEmpty()) {
            return null;
        }

        try {
            String prompt = buildPrompt(reviews);

            ObjectMapper mapper = new ObjectMapper();
            var requestBody = mapper.createObjectNode()
                    .put("model", MODEL)
                    .put("max_tokens", 100);
            requestBody.putArray("messages")
                    .addObject()
                    .put("role", "user")
                    .put("content", prompt);

            String responseStr = restClient.post()
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .header("content-type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = mapper.readTree(responseStr);
            JsonNode content = root.path("content");
            if (content.isArray() && !content.isEmpty()) {
                String text = content.get(0).path("text").asString();
                if (text != null && !text.isBlank()) {
                    return text.trim();
                }
            }
            return null;
        } catch (Exception e) {
            System.err.println("[AiSummaryService] LLM summary generation failed, falling back: " + e.getMessage());
            return null;
        }
    }

    private String buildPrompt(List<String> reviews) {
        StringBuilder sb = new StringBuilder(
                "You are summarizing a community carpooling user's reputation for a profile page. "
                        + "Based only on the following rider/driver reviews, write a single 1-2 sentence "
                        + "summary of this user's reputation. Be neutral and factual, do not invent details "
                        + "not supported by the reviews.\n\nReviews:\n");
        for (String review : reviews) {
            sb.append("- ").append(review).append('\n');
        }
        return sb.toString();
    }
}
