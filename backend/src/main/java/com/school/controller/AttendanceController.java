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

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/mark")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public List<AttendanceResponse> mark(@Valid @RequestBody AttendanceMarkRequest request,
                                          @AuthenticationPrincipal CustomUserDetails principal) {
        return attendanceService.markAttendance(request, principal.getUser().getRefId());
    }

    @GetMapping("/class/{classId}")
    public List<AttendanceResponse> getByClassAndDate(@PathVariable String classId,
                                                       @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                                       @RequestParam("subjectId") String subjectId) {
        return attendanceService.getByClassAndDate(classId, date, subjectId);
    }

    @GetMapping("/student/{studentId}")
    public List<AttendanceResponse> getByStudent(@PathVariable String studentId) {
        return attendanceService.getByStudent(studentId);
    }
}