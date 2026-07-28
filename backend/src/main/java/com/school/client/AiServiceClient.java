package com.school.client;

import com.school.dto.ai.AiPerformanceAnalysisRequest;
import com.school.dto.response.PerformanceAnalysisResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

// Thin wrapper around the Python FastAPI service. Only the backend calls
// this — never the frontend directly (see Phase 1 architecture notes).
// The AI service owns the actual regression/ML math; this client just
// hands it the student's mark history and returns the typed result.
@Component
@RequiredArgsConstructor
public class AiServiceClient {

    private final WebClient aiServiceWebClient;

    public PerformanceAnalysisResponse getPerformanceAnalysis(AiPerformanceAnalysisRequest request) {
        return aiServiceWebClient.post()
                .uri("/predict/performance")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(PerformanceAnalysisResponse.class)
                .block();
    }
}