package com.cdac.carpooling.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.cdac.carpooling.model.Rating;
import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.RatingRepository;
import com.cdac.carpooling.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiSummaryBatchScheduler {

    private static final Set<String> RULE_BASED_SUMMARIES = Set.of(
            "New user. No rides yet.",
            "Excellent reputation: highly trusted and reliable.",
            "Good standing with the community.",
            "Average standing: some room to improve.",
            "Below average: flagged for review."
    );

    private final UserRepository userRepository;
    private final RatingRepository ratingRepository;
    private final AiSummaryService aiSummaryService;

    /**
     * Hourly Scheduled Task:
     * Runs every 1 hour (3,600,000 ms).
     * Processes latest 20 reviews for users who:
     * 1. Do NOT have an AI summary generated yet (Initial First Run), OR
     * 2. Received at least 1 new review in the last 1 hour.
     */
    @Scheduled(fixedRate = 3600000, initialDelay = 30000)
    public void runHourlyAiSummaryBatch() {
        System.out.println("\n================================================================================");
        System.out.println("[AI SUMMARY BATCH] Starting hourly AI summary check...");
        System.out.println("================================================================================");
        try {
            List<User> users = userRepository.findAll();
            Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
            int updatedCount = 0;

            for (User user : users) {
                List<Rating> ratings = ratingRepository.findByReviewedUserId(user.getId());
                if (ratings == null || ratings.isEmpty()) {
                    continue;
                }

                // Check if user has non-empty text reviews
                List<String> textReviews = ratings.stream()
                        .map(Rating::getTextReview)
                        .filter(t -> t != null && !t.isBlank())
                        .toList();

                if (textReviews.isEmpty()) {
                    continue;
                }

                String currentSummary = user.getReputationProfile() != null
                        ? user.getReputationProfile().getAiSummary()
                        : null;

                boolean needsInitialSummary = currentSummary == null
                        || currentSummary.isBlank()
                        || RULE_BASED_SUMMARIES.contains(currentSummary);

                boolean hasReviewInLastHour = ratings.stream()
                        .anyMatch(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(oneHourAgo));

                // On first run: process all existing users who lack an AI summary.
                // On subsequent runs: only process users who received a new review in the last 1 hour.
                if (!needsInitialSummary && !hasReviewInLastHour) {
                    continue;
                }

                System.out.println("[AI SUMMARY BATCH] -> Processing User: " + user.getName() + " (ID: " + user.getId() + ")");
                System.out.println("[AI SUMMARY BATCH] -> Found " + textReviews.size() + " review(s) to summarize.");

                String newSummary = aiSummaryService.generateSummary(ratings);
                if (newSummary != null && !newSummary.isBlank()) {
                    User.ReputationProfile profile = user.getReputationProfile();
                    if (profile == null) {
                        profile = new User.ReputationProfile();
                    }
                    profile.setAiSummary(newSummary);
                    user.setReputationProfile(profile);
                    userRepository.save(user);
                    updatedCount++;

                    System.out.println("[AI SUMMARY BATCH] -> AI Summary Output: \"" + newSummary + "\"");
                    System.out.println("[AI SUMMARY BATCH] [SAVED] New AI summary stored in MongoDB Atlas for '" + user.getName() + "'!");
                    System.out.println("--------------------------------------------------------------------------------");
                } else {
                    System.out.println("[AI SUMMARY BATCH] [OFFLINE] AI Cloud Services (Groq / Gemini) unavailable or unconfigured.");
                    System.out.println("[AI SUMMARY BATCH] [PRESERVED] Kept existing MongoDB summary for user '" + user.getName() + "'.");
                    System.out.println("--------------------------------------------------------------------------------");
                }
            }
            System.out.println("[AI SUMMARY BATCH] [FINISHED] Updated " + updatedCount + " user summary/summaries in DB.");
            System.out.println("================================================================================\n");
        } catch (Exception e) {
            log.error("[AI SUMMARY BATCH] [ERROR] Batch encountered error: {}", e.getMessage());
        }
    }
}
