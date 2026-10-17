package com.school.controller;

import com.school.dto.request.HomeworkRequest;
import com.school.dto.response.HomeworkResponse;
import com.school.security.CustomUserDetails;
import com.school.service.HomeworkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.school.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.school.service.TeacherAssignmentService;
import com.school.security.AuthorizationService;

@RestController
@RequestMapping("/api/homework")
@RequiredArgsConstructor
public class HomeworkController {

    private final HomeworkService homeworkService;
    private final TeacherAssignmentService teacherAssignmentService;
    private final AuthorizationService authorizationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public HomeworkResponse create(@Valid @RequestBody HomeworkRequest request,
                                    @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if ("ADMIN".equals(role)) {
            return homeworkService.create(request, principalRef);
        }

        if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, request.getClassId(), request.getSubjectId())) {
            throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
        }

        return homeworkService.create(request, principalRef);
    }

    @GetMapping("/class/{classId}")
    public List<HomeworkResponse> findByClass(@PathVariable String classId) {
        return homeworkService.findByClass(classId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public HomeworkResponse update(@PathVariable String id, @Valid @RequestBody HomeworkRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if ("ADMIN".equals(role)) {
            return homeworkService.update(id, request);
        }

        if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, request.getClassId(), request.getSubjectId())) {
            throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
        }

        return homeworkService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails principal) {
        String role = principal != null ? principal.getUser().getRole().name() : null;
        String principalRef = principal != null ? principal.getUser().getRefId() : null;

        if ("ADMIN".equals(role)) {
            homeworkService.delete(id);
            return;
        }

        // Fetch homework and verify teacher assignment
        var hw = homeworkService.findById(id);
        if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, hw.getClassId(), hw.getSubjectId())) {
            throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
        }

        homeworkService.delete(id);
    }
}