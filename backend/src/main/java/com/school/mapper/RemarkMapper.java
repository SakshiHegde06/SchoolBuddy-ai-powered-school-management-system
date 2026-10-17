package com.school.mapper;

import com.school.document.Remark;
import com.school.dto.response.RemarkResponse;

public class RemarkMapper {

    private RemarkMapper() {
    }

    public static RemarkResponse toResponse(Remark remark) {
        return RemarkResponse.builder()
                .id(remark.getId())
                .studentId(remark.getStudentId())
                .teacherId(remark.getTeacherId())
                .teacherName(remark.getTeacherName())
                .remark(remark.getRemark())
                .createdAt(remark.getCreatedAt())
                .build();
    }
}