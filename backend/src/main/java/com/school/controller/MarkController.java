package com.school.controller;

import com.school.dto.request.MarkRequest;
import com.school.dto.response.MarkResponse;
import com.school.security.CustomUserDetails;
import com.school.service.MarkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.school.security.AuthorizationService;
import com.school.security.CustomUserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marks")
@RequiredArgsConstructor
public class MarkController {

    private final MarkService markService;
    private final AuthorizationService authorizationService;
    private final com.school.service.TeacherAssignmentService teacherAssignmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public MarkResponse create(@Valid @RequestBody MarkRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return markService.create(request, principal.getUser().getRefId());
    }

    @GetMapping("/student/{studentId}")
    public List<MarkResponse> findByStudent(@PathVariable String studentId, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!authorizationService.canViewStudent(principal, principalRef, role, studentId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view this student's marks");
        }

        List<MarkResponse> marks = markService.findByStudent(studentId);
        return marks;
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public MarkResponse publish(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!"ADMIN".equals(role)) {
            var mark = markService.findById(id);
            if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, mark.getClassId(), mark.getSubjectId())) {
                throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
            }
        }

        return markService.publish(id);
    }

    @PostMapping("/publish-by-exam/{examId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public List<MarkResponse> publishByExam(@PathVariable String examId) {
        // Bulk publish is intentionally simple: a teacher publishing an exam's
        // marks is expected to only be entering marks for classes/subjects
        // they're assigned to in the first place (enforced at create/update time).
        return markService.publishByExam(examId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public MarkResponse update(@PathVariable String id, @Valid @RequestBody MarkRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if ("ADMIN".equals(role)) {
            return markService.update(id, request);
        }

        // For teachers, ensure they are assigned to the class-subject of the mark
        var mark = markService.findById(id);
        if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, mark.getClassId(), mark.getSubjectId())) {
            throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
        }

        return markService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if ("ADMIN".equals(role)) {
            markService.delete(id);
            return;
        }

        var mark = markService.findById(id);
        if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, mark.getClassId(), mark.getSubjectId())) {
            throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
        }

        markService.delete(id);
    }
}