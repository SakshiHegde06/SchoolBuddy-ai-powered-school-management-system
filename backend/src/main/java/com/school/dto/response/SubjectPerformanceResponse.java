package com.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectPerformanceResponse {
    private String subjectId;
    private String subjectName;
    private int assessmentCount;
    private double averageScore;      // average percentage across all assessments
    private double latestScore;       // percentage of the most recent assessment
    private double predictedNextScore; // linear regression projection, clamped 0-100
    private double trendSlope;        // percentage-points change per assessment
    private String trend;             // IMPROVING | DECLINING | STABLE | INSUFFICIENT_DATA
}