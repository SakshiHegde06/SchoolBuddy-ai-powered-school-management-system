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
    private double averageScore;
    private double latestScore;
    private double predictedNextScore;
    private double trendSlope;
    private String trend;
}