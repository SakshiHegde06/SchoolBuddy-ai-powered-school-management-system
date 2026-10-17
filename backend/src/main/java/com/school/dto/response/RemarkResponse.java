package com.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class RemarkResponse {

    private String id;

    private String studentId;

    private String studentName;

    private String classId;

    private String className;

    private String subjectId;

    private String subjectName;

    private String examType;

    private String teacherId;

    private String teacherName;

    private String remark;

    private Instant createdAt;
}