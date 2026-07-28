package com.school.dto.request;

import com.school.document.AttendanceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AttendanceRecordRequest {

    @NotBlank
    private String studentId;

    @NotNull
    private AttendanceStatus status;
}