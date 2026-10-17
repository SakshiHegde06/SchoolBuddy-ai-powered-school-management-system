package com.school.mapper;

import com.school.document.Student;
import com.school.dto.response.StudentResponse;

public class StudentMapper {
    private StudentMapper() {}

    public static StudentResponse toResponse(Student student) {
        if (student == null) return null;
        return StudentResponse.builder()
                .id(student.getId())
                .userId(student.getUserId())
                .name(student.getName())
                .email(student.getEmail())
                .dob(student.getDob())
                .classId(student.getClassId())
                .section(student.getSection())
                .parentIds(student.getParentIds())
                .admissionNumber(student.getAdmissionNumber())
                .rollNumber(student.getRollNumber())
                .build();
    }
}