package com.school.mapper;

import com.school.document.Teacher;
import com.school.dto.response.TeacherResponse;

public class TeacherMapper {
    private TeacherMapper() {}

    public static TeacherResponse toResponse(Teacher teacher) {
        if (teacher == null) return null;
        return TeacherResponse.builder()
                .id(teacher.getId())
                .userId(teacher.getUserId())
                .name(teacher.getName())
                .email(teacher.getEmail())
                .phone(teacher.getPhone())
                .address(teacher.getAddress())
                .subjectIds(teacher.getSubjectIds())
                .classIds(teacher.getClassIds())
                .maxWeeklyHours(teacher.getMaxWeeklyHours())
                .classTeacherOf(teacher.getClassTeacherOf())
                .build();
    }
}