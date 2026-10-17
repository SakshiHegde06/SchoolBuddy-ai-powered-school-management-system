package com.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response containing a teacher assignment with enriched details.
 *
 * Example response:
 * {
 *   "id": "assign-789",
 *   "teacherId": "priya-123",
 *   "teacherName": "Priya Sharma",
 *   "teacherEmail": "priya@school.com",
 *   "classId": "8A",
 *   "className": "Class 8",
 *   "classSection": "A",
 *   "subjectId": "science-456",
 *   "subjectName": "Science",
 *   "effectiveFrom": "2026-09-01",
 *   "effectiveTo": null,
 *   "isClassTeacher": false,
 *   "studentCount": 35
 * }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherAssignmentResponse {

    private String id;

    private String teacherId;

    private String teacherName;

    private String teacherEmail;

    private String classId;

    private String className;

    private String classSection;

    private String subjectId;

    private String subjectName;

    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;

    private boolean isClassTeacher;

    private String notes;

    // Derived: number of students in this class
    // (populated by service when fetching)
    private int studentCount;
}
