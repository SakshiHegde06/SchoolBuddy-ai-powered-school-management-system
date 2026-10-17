package com.school.dto.request;

import com.school.document.MarkType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ExamRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String classId;

    // Optional — null means this exam applies to every subject in the class
    private String subjectId;

    @NotNull
    private MarkType type;

    @Positive
    private double maxMarks;

    private LocalDate startDate;

    private LocalDate endDate;

    private String academicYearId;
}