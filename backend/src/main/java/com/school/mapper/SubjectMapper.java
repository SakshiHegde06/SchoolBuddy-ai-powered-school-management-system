package com.school.mapper;

import com.school.document.Subject;
import com.school.dto.response.SubjectResponse;

public class SubjectMapper {
    private SubjectMapper() {}

    public static SubjectResponse toResponse(Subject subject) {
        if (subject == null) return null;
        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .code(subject.getCode())
                .practical(subject.isPractical())
                .weeklyFrequency(subject.getWeeklyFrequency())
                .build();
    }
}