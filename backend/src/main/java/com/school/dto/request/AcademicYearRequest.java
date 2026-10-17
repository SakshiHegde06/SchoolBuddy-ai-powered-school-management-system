package com.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AcademicYearRequest {

    @NotBlank
    private String label;

    private LocalDate startDate;

    private LocalDate endDate;

    private boolean isCurrent;
}