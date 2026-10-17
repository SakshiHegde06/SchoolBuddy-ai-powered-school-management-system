package com.school.service;

import com.school.dto.ai.AiTimetableRequest;
import com.school.dto.ai.AiTimetableResponse;
import com.school.dto.ai.PerformanceAnalysisRequestDto;
import com.school.dto.response.PerformanceAnalysisResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
public class AiServiceClient {

    private final WebClient webClient;

    public AiServiceClient(@Qualifier("aiServiceWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    public AiTimetableResponse generateTimetable(AiTimetableRequest request) {
        try {
            return webClient.post()
                    .uri("/generate-timetable")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AiTimetableResponse.class)
                    .block();
        } catch (WebClientResponseException e) {
            throw new RuntimeException("FastAPI Timetable Error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Could not connect to FastAPI server on port 8000", e);
        }
    }

    public PerformanceAnalysisResponse getPerformanceAnalysis(PerformanceAnalysisRequestDto request) {
        try {
            return webClient.post()
                    .uri("/analyze-performance")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(PerformanceAnalysisResponse.class)
                    .block();
        } catch (Exception e) {
            // Graceful fallback if FastAPI service is starting up, unreachable, or offline
            return generateLocalFallbackAnalysis(request);
        }
    }

    private PerformanceAnalysisResponse generateLocalFallbackAnalysis(PerformanceAnalysisRequestDto request) {
        if (request == null || request.getSubjects() == null || request.getSubjects().isEmpty()) {
            return PerformanceAnalysisResponse.builder()
                    .studentId(request != null ? request.getStudentId() : "")
                    .riskLevel("INSUFFICIENT_DATA")
                    .overallAverage(0.0)
                    .summary("Not enough mark history yet to generate an analysis.")
                    .strengths(java.util.List.of())
                    .focusAreas(java.util.List.of())
                    .subjects(java.util.List.of())
                    .build();
        }

        java.util.List<com.school.dto.response.SubjectPerformanceResponse> subjectResponses = new java.util.ArrayList<>();
        double totalAvg = 0.0;

        for (var sub : request.getSubjects()) {
            var marks = sub.getMarks();
            if (marks == null || marks.isEmpty()) continue;

            double avg = marks.stream()
                    .mapToDouble(m -> m.getMaxMarks() > 0 ? (m.getMarksObtained() / m.getMaxMarks()) * 100.0 : 0.0)
                    .average().orElse(0.0);
            double latest = marks.get(marks.size() - 1).getMaxMarks() > 0
                    ? (marks.get(marks.size() - 1).getMarksObtained() / marks.get(marks.size() - 1).getMaxMarks()) * 100.0
                    : 0.0;

            String trend = "STABLE";
            if (marks.size() >= 2) {
                double first = marks.get(0).getMaxMarks() > 0
                        ? (marks.get(0).getMarksObtained() / marks.get(0).getMaxMarks()) * 100.0 : 0.0;
                if (latest - first > 5.0) trend = "IMPROVING";
                else if (first - latest > 5.0) trend = "DECLINING";
            }

            subjectResponses.add(com.school.dto.response.SubjectPerformanceResponse.builder()
                    .subjectId(sub.getSubjectId())
                    .subjectName(sub.getSubjectName())
                    .assessmentCount(marks.size())
                    .averageScore(Math.round(avg * 10.0) / 10.0)
                    .latestScore(Math.round(latest * 10.0) / 10.0)
                    .predictedNextScore(Math.round(latest * 10.0) / 10.0)
                    .trendSlope(0.0)
                    .trend(trend)
                    .build());
            totalAvg += avg;
        }

        double overallAvg = subjectResponses.isEmpty() ? 0.0 : Math.round((totalAvg / subjectResponses.size()) * 10.0) / 10.0;
        java.util.List<String> strengths = subjectResponses.stream()
                .filter(s -> s.getAverageScore() >= 75.0)
                .map(com.school.dto.response.SubjectPerformanceResponse::getSubjectName)
                .limit(2).toList();
        java.util.List<String> focusAreas = subjectResponses.stream()
                .filter(s -> s.getAverageScore() < 60.0 || "DECLINING".equals(s.getTrend()))
                .map(com.school.dto.response.SubjectPerformanceResponse::getSubjectName)
                .limit(2).toList();

        String risk = overallAvg < 40.0 ? "HIGH" : (overallAvg < 60.0 || !focusAreas.isEmpty() ? "MEDIUM" : "LOW");

        return PerformanceAnalysisResponse.builder()
                .studentId(request.getStudentId())
                .riskLevel(risk)
                .overallAverage(overallAvg)
                .summary(overallAvg > 0 ? "Overall average is " + overallAvg + "%." : "Not enough mark history.")
                .strengths(strengths)
                .focusAreas(focusAreas)
                .subjects(subjectResponses)
                .build();
    }
}