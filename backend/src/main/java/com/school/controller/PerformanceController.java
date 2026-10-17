package com.school.controller;

import com.school.dto.response.ClassPerformanceResponse;
import com.school.dto.response.PerformanceAnalysisResponse;
import com.school.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.school.security.AuthorizationService;
import com.school.security.CustomUserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;
    private final AuthorizationService authorizationService;

    @GetMapping("/student/{studentId}")
    public PerformanceAnalysisResponse getStudentPerformance(
            @PathVariable String studentId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null && principal.getUser() != null ? principal.getUser().getRefId() : null;
        String role = principal != null && principal.getUser() != null && principal.getUser().getRole() != null
                ? principal.getUser().getRole().name() : null;

        if (!authorizationService.canViewStudent(principal, principalRef, role, studentId)) {
            throw new AccessDeniedException("Not authorized to view this student's performance");
        }
        return performanceService.analyzeStudent(studentId);
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ClassPerformanceResponse getClassPerformance(
            @PathVariable String classId,
            @RequestParam(required = false) String subjectId) {
        return performanceService.getClassPerformance(classId, subjectId);
    }
}