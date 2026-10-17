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
    private String riskLevel;
    private double overallAverage;
    private String summary;
    private List<String> strengths;
    private List<String> focusAreas;
    private List<SubjectPerformanceResponse> subjects;
}