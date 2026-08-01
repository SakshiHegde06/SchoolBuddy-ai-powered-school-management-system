package com.school.service;

import com.school.dto.response.PerformanceAnalysisResponse;

public interface PerformanceService {
    PerformanceAnalysisResponse analyzeStudent(String studentId);
}
