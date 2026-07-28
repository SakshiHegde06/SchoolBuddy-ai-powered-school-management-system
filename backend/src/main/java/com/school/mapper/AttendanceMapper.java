package com.school.mapper;

import com.school.document.Attendance;
import com.school.dto.response.AttendanceResponse;

public class AttendanceMapper {
    private AttendanceMapper() {}

    public static AttendanceResponse toResponse(Attendance attendance) {
        if (attendance == null) return null;
        return AttendanceResponse.builder()
                .id(attendance.getId())
                .studentId(attendance.getStudentId())
                .classId(attendance.getClassId())
                .date(attendance.getDate())
                .status(attendance.getStatus())
                .markedBy(attendance.getMarkedBy())
                .build();
    }
}