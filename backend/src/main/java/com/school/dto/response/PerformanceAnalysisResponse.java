package com.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceAnalysisResponse {
    private String studentId;
    private String riskLevel;          // LOW | MEDIUM | HIGH | INSUFFICIENT_DATA
    private double overallAverage;
    private String summary;            // human-readable one-liner
    private List<String> strengths;    // subject names doing well
    private List<String> focusAreas;   // subject names needing attention
    private List<SubjectPerformanceResponse> subjects;
}