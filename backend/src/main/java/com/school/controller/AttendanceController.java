package com.school.controller;

import com.school.dto.request.AttendanceMarkRequest;
import com.school.dto.response.AttendanceResponse;
import com.school.security.CustomUserDetails;
import com.school.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import com.school.security.AuthorizationService;
import com.school.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.school.service.TeacherAssignmentService;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final AuthorizationService authorizationService;
    private final TeacherAssignmentService teacherAssignmentService;

    @PostMapping("/mark")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public List<AttendanceResponse> mark(@Valid @RequestBody AttendanceMarkRequest request,
                                          @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if ("ADMIN".equals(role)) {
            return attendanceService.markAttendance(request, principalRef);
        }

        // Teacher must be assigned to the class+subject
        if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, request.getClassId(), request.getSubjectId())) {
            throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
        }

        return attendanceService.markAttendance(request, principalRef);
    }

    @GetMapping("/class/{classId}")
    public List<AttendanceResponse> getByClassAndDate(@PathVariable String classId,
                                                       @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                                       @RequestParam(value = "subjectId", required = false) String subjectId) {
        return attendanceService.getByClassAndDate(classId, date, subjectId);
    }

    @GetMapping("/student/{studentId}")
    public List<AttendanceResponse> getByStudent(@PathVariable String studentId, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!authorizationService.canViewStudent(principal, principalRef, role, studentId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view this student's attendance");
        }

        return attendanceService.getByStudent(studentId);
    }
}