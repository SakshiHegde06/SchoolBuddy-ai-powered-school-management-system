package com.school.controller;

import com.school.document.Parent;
import com.school.document.Role;
import com.school.dto.response.PerformanceAnalysisResponse;
import com.school.repository.ParentRepository;
import com.school.security.CustomUserDetails;
import com.school.service.PerformanceAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class PerformanceAnalysisController {

    private final PerformanceAnalysisService performanceAnalysisService;
    private final ParentRepository parentRepository;

    @GetMapping("/{studentId}/performance-analysis")
    public ResponseEntity<PerformanceAnalysisResponse> getPerformanceAnalysis(
            @PathVariable String studentId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        assertCanView(studentId, principal);
        return ResponseEntity.ok(performanceAnalysisService.analyze(studentId));
    }

    // A student may only see their own analysis; a parent only for their
    // linked children; teachers and admins can view any student's.
    private void assertCanView(String studentId, CustomUserDetails principal) {
        Role role = principal.getUser().getRole();
        String refId = principal.getUser().getRefId();

        if (role == Role.TEACHER || role == Role.ADMIN) {
            return;
        }

        if (role == Role.STUDENT) {
            if (!studentId.equals(refId)) {
                throw new AccessDeniedException("Students may only view their own performance analysis");
            }
            return;
        }

        if (role == Role.PARENT) {
            Parent parent = parentRepository.findById(refId)
                    .orElseThrow(() -> new AccessDeniedException("Parent profile not found"));
            if (!parent.getChildrenIds().contains(studentId)) {
                throw new AccessDeniedException("Parents may only view their own children's performance analysis");
            }
            return;
        }

        throw new AccessDeniedException("Not authorized to view this performance analysis");
    }
}