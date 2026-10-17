package com.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranscriptReportDto {
    private String studentId;
    private String studentName;
    private String rollNumber;
    private String admissionNumber;
    private String classId;
    private String className;
    private String section;
    private String email;
    private LocalDate dob;

    // Academic Meta
    private String schoolName;
    private String schoolAffiliation;
    private String schoolAddress;
    private String academicYear;
    private String evaluationTerm;
    private LocalDate issueDate;

    // Subject Performance
    private List<SubjectPerformanceDto> subjects;
    private double totalMarksObtained;
    private double totalMaxMarks;
    private double overallPercentage;
    private double gpa;
    private String overallGrade;
    private String academicStanding; // e.g., "First Class with Distinction"

    // Attendance Summary
    private int totalWorkingDays;
    private int daysPresent;
    private double attendancePercentage;
    private String attendanceStatus; // e.g., "Regular"

    // Teacher remarks
    private List<String> teacherRemarks;

    // Verification
    private String verificationCode;
    private String verificationUrl;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubjectPerformanceDto {
        private String subjectId;
        private String subjectName;
        private String subjectCode;
        private double marksObtained;
        private double maxMarks;
        private double percentage;
        private String grade;
        private double gradePoints;
        private String status; // PASS, DISTINCTION
        private Double attendancePercentage;
        private String attendanceStatus; // e.g. "Eligible (>=75%)" or "Shortage (<75%)"
    }
}
