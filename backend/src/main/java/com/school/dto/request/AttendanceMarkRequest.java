package com.school.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class AttendanceMarkRequest {

    @NotBlank
    private String classId;

    @NotNull
    private LocalDate date;

    @NotEmpty
    @Valid
    private List<AttendanceRecordRequest> records;
}