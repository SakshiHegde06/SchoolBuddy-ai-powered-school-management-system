package com.school.client;

import com.school.dto.ai.PerformanceAnalysisRequestDto;
import com.school.dto.response.PerformanceAnalysisResponse;
import com.school.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private final WebClient aiServiceWebClient;

    public PerformanceAnalysisResponse getPerformanceAnalysis(PerformanceAnalysisRequestDto request) {
        try {
            return aiServiceWebClient.post()
                    .uri("/predict/performance")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(PerformanceAnalysisResponse.class)
                    .block();
        } catch (WebClientResponseException ex) {
            log.error("AI service rejected request for student {}. Request was: {}. AI service said: {}",
                    request.getStudentId(), request, ex.getResponseBodyAsString());
            throw new ApiException("Could not reach the AI service for performance analysis. Please try again later.");
        } catch (WebClientException ex) {
            log.error("AI service call failed for student {}", request.getStudentId(), ex);
            throw new ApiException("Could not reach the AI service for performance analysis. Please try again later.");
        }
    }
}