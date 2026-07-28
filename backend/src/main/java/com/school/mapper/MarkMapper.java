package com.school.mapper;

import com.school.document.MarkEntry;
import com.school.dto.response.MarkResponse;

public class MarkMapper {
    private MarkMapper() {}

    public static MarkResponse toResponse(MarkEntry mark) {
        if (mark == null) return null;
        return MarkResponse.builder()
                .id(mark.getId())
                .studentId(mark.getStudentId())
                .subjectId(mark.getSubjectId())
                .academicYearId(mark.getAcademicYearId())
                .term(mark.getTerm())
                .type(mark.getType())
                .marksObtained(mark.getMarksObtained())
                .maxMarks(mark.getMaxMarks())
                .enteredBy(mark.getEnteredBy())
                .date(mark.getDate())
                .build();
    }
}