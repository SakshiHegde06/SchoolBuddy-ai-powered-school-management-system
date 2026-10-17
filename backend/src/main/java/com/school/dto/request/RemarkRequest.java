package com.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RemarkRequest {

    @NotBlank
    private String studentId;

    @NotBlank
    private String classId;          // Which class was the student in

    @NotBlank
    private String subjectId;        // Which subject is this remark for

    @NotBlank
    private String examType;         // Which exam (FA1, FA2, Midterm, etc)

    @NotBlank
    private String remark;
}