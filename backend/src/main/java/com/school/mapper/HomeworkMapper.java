package com.school.mapper;

import com.school.document.Homework;
import com.school.dto.response.HomeworkResponse;

public class HomeworkMapper {
    private HomeworkMapper() {}

    public static HomeworkResponse toResponse(Homework homework) {
        if (homework == null) return null;
        return HomeworkResponse.builder()
                .id(homework.getId())
                .classId(homework.getClassId())
                .subjectId(homework.getSubjectId())
                .teacherId(homework.getTeacherId())
                .title(homework.getTitle())
                .description(homework.getDescription())
                .attachmentUrls(homework.getAttachmentUrls())
                .dueDate(homework.getDueDate())
                .createdAt(homework.getCreatedAt())
                .build();
    }
}