package com.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * Request to assign a teacher to a class-subject combination.
 *
 * Example:
 * {
 *   "teacherId": "priya-123",
 *   "classId": "8A",
 *   "subjectId": "science-456",
 *   "effectiveFrom": "2026-09-01",
 *   "effectiveTo": null,
 *   "isClassTeacher": false
 * }
 */
@Data
public class TeacherAssignmentRequest {

    @NotBlank
    private String teacherId;

    @NotBlank
    private String classId;

    @NotBlank
    private String subjectId;

    // When this assignment starts
    @NotNull
    private LocalDate effectiveFrom;

    // When this assignment ends (leave null for ongoing)
    private LocalDate effectiveTo;

    // Is this the class teacher role?
    private boolean isClassTeacher;

    // Optional notes about the assignment
    private String notes;
}
