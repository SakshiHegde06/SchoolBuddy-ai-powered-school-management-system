package com.school.service;

import com.school.dto.response.PerformanceAnalysisResponse;

public interface PerformanceAnalysisService {
    PerformanceAnalysisResponse analyze(String studentId);
}