package com.school.service;

import com.school.dto.request.AttendanceMarkRequest;
import com.school.dto.response.AttendanceResponse;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {
    List<AttendanceResponse> markAttendance(AttendanceMarkRequest request, String markedByTeacherId);
    List<AttendanceResponse> getByClassAndDate(String classId, LocalDate date, String subjectId);
    List<AttendanceResponse> getByStudent(String studentId);
}