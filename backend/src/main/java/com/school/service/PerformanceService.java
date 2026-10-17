package com.school.service;

import com.school.dto.response.ClassPerformanceResponse;
import com.school.dto.response.PerformanceAnalysisResponse;

public interface PerformanceService {
    PerformanceAnalysisResponse analyzeStudent(String studentId);

    /** Class-wide stats (average/highest/lowest/pass% + students needing attention). subjectId is optional. */
    ClassPerformanceResponse getClassPerformance(String classId, String subjectId);
}