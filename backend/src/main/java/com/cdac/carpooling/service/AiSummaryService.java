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

    private static final int MAX_REVIEWS = 20;
    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_MODEL = "llama-3.1-8b-instant";
    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    private final RestClient restClient;

    @Value("${groq.api.key:${GROQ_API_KEY:}}")
    private String groqApiKey;

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    public AiSummaryService() {
        this.restClient = RestClient.create();
    }

    /**
     * Generates a 1-2 sentence reputation summary from a user's latest 20 review texts.
     * Strategy:
     * 1. Primary: Groq Cloud API (llama-3.1-8b-instant) if GROQ_API_KEY is configured (~150ms).
     * 2. Fallback: Gemini Cloud API if GEMINI_API_KEY is configured.
     * 3. Preserves existing summary in MongoDB if no API key is available or requests fail.
     */
    public String generateSummary(List<Rating> ratings) {
        List<String> reviews = ratings.stream()
                .map(Rating::getTextReview)
                .filter(text -> text != null && !text.isBlank())
                .limit(MAX_REVIEWS)
                .toList();

        if (reviews.isEmpty()) {
            return null;
        }

        // 1. Try Groq Cloud API
        if (groqApiKey != null && !groqApiKey.isBlank()) {
            String groqSummary = tryGenerateGroqSummary(reviews);
            if (groqSummary != null && !groqSummary.isBlank()) {
                return groqSummary;
            }
        }

        // 2. Try Gemini Cloud API
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            String geminiSummary = tryGenerateGeminiSummary(reviews);
            if (geminiSummary != null && !geminiSummary.isBlank()) {
                return geminiSummary;
            }
        }

        return null;
    }

    private String tryGenerateGroqSummary(List<String> reviews) {
        try {
            System.out.println("[AiSummaryService] Sending " + reviews.size() + " review(s) to Groq Cloud API (" + GROQ_MODEL + ")...");

            String prompt = buildPrompt(reviews);
            ObjectMapper mapper = new ObjectMapper();

            var requestBody = mapper.createObjectNode();
            requestBody.put("model", GROQ_MODEL);
            requestBody.put("max_tokens", 120);
            requestBody.put("temperature", 0.3);

            var messagesArr = requestBody.putArray("messages");
            var msgObj = messagesArr.addObject();
            msgObj.put("role", "user");
            msgObj.put("content", prompt);

            String responseStr = restClient.post()
                    .uri(GROQ_URL)
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey.trim())
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = mapper.readTree(responseStr);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                String text = choices.get(0).path("message").path("content").asText();
                if (text != null && !text.isBlank()) {
                    String cleanSummary = text.trim();
                    System.out.println("[AiSummaryService] Groq returned: \"" + cleanSummary + "\"");
                    return cleanSummary;
                }
            }
        } catch (Exception e) {
            System.out.println("[AiSummaryService] Groq Cloud API call failed: " + e.getMessage());
        }
        return null;
    }

    private String tryGenerateGeminiSummary(List<String> reviews) {
        try {
            System.out.println("[AiSummaryService] Sending " + reviews.size() + " review(s) to Gemini Cloud API...");
            String prompt = buildPrompt(reviews);

            ObjectMapper mapper = new ObjectMapper();
            var requestBody = mapper.createObjectNode();
            var contentsArray = requestBody.putArray("contents");
            var contentObj = contentsArray.addObject();
            var partsArray = contentObj.putArray("parts");
            partsArray.addObject().put("text", prompt);

            String urlWithKey = GEMINI_URL + "?key=" + geminiApiKey.trim();

            String responseStr = restClient.post()
                    .uri(urlWithKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = mapper.readTree(responseStr);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    String text = parts.get(0).path("text").asString();
                    if (text != null && !text.isBlank()) {
                        String cleanSummary = text.trim();
                        System.out.println("[AiSummaryService] Gemini returned: \"" + cleanSummary + "\"");
                        return cleanSummary;
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("[AiSummaryService] Gemini Cloud API call failed: " + e.getMessage());
        }
        return null;
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
