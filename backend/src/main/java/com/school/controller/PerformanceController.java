package com.school.controller;

import com.school.dto.response.PerformanceAnalysisResponse;
import com.school.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;

    @GetMapping("/student/{studentId}")
    public PerformanceAnalysisResponse getStudentPerformance(@PathVariable String studentId) {
        return performanceService.analyzeStudent(studentId);
    }
}