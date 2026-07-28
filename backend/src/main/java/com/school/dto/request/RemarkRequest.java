package com.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RemarkRequest {

    @NotBlank
    private String studentId;

    @NotBlank
    private String remark;
}