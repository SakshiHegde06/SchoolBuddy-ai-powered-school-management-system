package com.school.controller;

import com.school.dto.request.RemarkRequest;
import com.school.dto.response.RemarkResponse;
import com.school.security.CustomUserDetails;
import com.school.service.RemarkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.school.security.AuthorizationService;
import com.school.security.CustomUserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/remarks")
@RequiredArgsConstructor
public class RemarkController {

    private final RemarkService remarkService;
    private final AuthorizationService authorizationService;
    private final com.school.service.TeacherAssignmentService teacherAssignmentService;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public RemarkResponse create(
            @Valid @RequestBody RemarkRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {

        String teacherId = principal.getUser().getRefId();

        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if ("ADMIN".equals(role)) {
            return remarkService.create(request, teacherId);
        }

        if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, request.getClassId(), request.getSubjectId())) {
            throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
        }

        return remarkService.create(request, teacherId);
    }

    @GetMapping("/student/{studentId}")
    public List<RemarkResponse> getByStudent(
            @PathVariable String studentId
    ) {

        // Authorization: only allowed if student is visible to principal
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails principal = null;
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) principal = (CustomUserDetails) auth.getPrincipal();
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!authorizationService.canViewStudent(principal, principalRef, role, studentId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view this student's remarks");
        }

        return remarkService.getByStudent(studentId);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public void delete(@PathVariable String id) {
        // Only admin or teacher assigned to the remark's class+subject can delete
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails principal = null;
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) principal = (CustomUserDetails) auth.getPrincipal();
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if ("ADMIN".equals(role)) {
            remarkService.delete(id);
            return;
        }

        var remark = remarkService.findById(id);
        if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, remark.getClassId(), remark.getSubjectId())) {
            throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
        }

        remarkService.delete(id);
    }
}