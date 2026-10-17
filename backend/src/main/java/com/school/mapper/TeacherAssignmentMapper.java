package com.school.mapper;

import com.school.document.SchoolClass;
import com.school.document.Subject;
import com.school.document.Teacher;
import com.school.document.TeacherAssignment;
import com.school.dto.response.TeacherAssignmentResponse;

/**
 * Mapper to convert TeacherAssignment entity to Response DTO.
 * This mapper enriches the assignment with teacher, class, and subject names.
 */
public class TeacherAssignmentMapper {

    public static TeacherAssignmentResponse toResponse(
            TeacherAssignment assignment,
            Teacher teacher,
            SchoolClass schoolClass,
            Subject subject,
            int studentCount) {

        return TeacherAssignmentResponse.builder()
                .id(assignment.getId())
                .teacherId(assignment.getTeacherId())
                .teacherName(teacher != null ? teacher.getName() : "Unknown")
                .teacherEmail(teacher != null ? teacher.getEmail() : null)
                .classId(assignment.getClassId())
                .className(schoolClass != null ? schoolClass.getName() : "Unknown")
                .classSection(schoolClass != null ? schoolClass.getSection() : null)
                .subjectId(assignment.getSubjectId())
                .subjectName(subject != null ? subject.getName() : "Unknown")
                .effectiveFrom(assignment.getEffectiveFrom())
                .effectiveTo(assignment.getEffectiveTo())
                .isClassTeacher(assignment.isClassTeacher())
                .notes(assignment.getNotes())
                .studentCount(studentCount)
                .build();
    }

    /**
     * Overload without enrichment (use when names/counts not needed)
     */
    public static TeacherAssignmentResponse toResponse(TeacherAssignment assignment) {
        return TeacherAssignmentResponse.builder()
                .id(assignment.getId())
                .teacherId(assignment.getTeacherId())
                .classId(assignment.getClassId())
                .subjectId(assignment.getSubjectId())
                .effectiveFrom(assignment.getEffectiveFrom())
                .effectiveTo(assignment.getEffectiveTo())
                .isClassTeacher(assignment.isClassTeacher())
                .notes(assignment.getNotes())
                .build();
    }
}
