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
public class ClassPerformanceResponse {

    private String classId;
    private String subjectId; // null = across all subjects

    private int studentCount;
    private double averagePercent;
    private double highestPercent;
    private double lowestPercent;
    private double passPercentage; // % of students averaging >= passThreshold

    private List<StudentAverage> studentsNeedingAttention;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAverage {
        private String studentId;
        private String studentName;
        private double averagePercent;
    }
}