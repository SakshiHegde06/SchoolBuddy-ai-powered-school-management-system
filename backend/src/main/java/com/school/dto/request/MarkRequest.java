package com.school.dto.request;

import com.school.document.MarkType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MarkRequest {

    @NotBlank
    private String studentId;

    @NotBlank
    private String subjectId;

    @NotBlank
    private String academicYearId;

    @NotBlank
    private String term;

    @NotNull
    private MarkType type;

    @PositiveOrZero
    private double marksObtained;

    @PositiveOrZero
    private double maxMarks;

    @NotNull
    private LocalDate date;
}