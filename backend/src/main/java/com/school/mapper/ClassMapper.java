package com.school.mapper;

import com.school.document.SchoolClass;
import com.school.dto.response.ClassResponse;

public class ClassMapper {
    private ClassMapper() {}

    public static ClassResponse toResponse(SchoolClass schoolClass) {
        if (schoolClass == null) return null;
        return ClassResponse.builder()
                .id(schoolClass.getId())
                .name(schoolClass.getName())
                .section(schoolClass.getSection())
                .academicYearId(schoolClass.getAcademicYearId())
                .classTeacherId(schoolClass.getClassTeacherId())
                .subjectIds(schoolClass.getSubjectIds())
                .studentCount(schoolClass.getStudentCount())
                .build();
    }
}
