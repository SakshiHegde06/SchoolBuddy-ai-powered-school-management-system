package com.school.dto.request;

import com.school.document.MarkStatus;
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
    private String classId;          // Which class was the student in

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

    // Optional — if set, term/type/maxMarks are typically derived from the Exam
    private String examId;

    // Optional — if omitted, defaults to PUBLISHED so marks are visible to parents/students
    private MarkStatus status;
}