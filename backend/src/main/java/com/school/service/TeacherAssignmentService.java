package com.school.service;

import com.school.dto.request.TeacherAssignmentRequest;
import com.school.dto.response.TeacherAssignmentResponse;

import java.util.List;

public interface TeacherAssignmentService {

    /**
     * Find all assignments for a teacher.
     * Used to build teacher's class list on dashboard.
     */
    List<TeacherAssignmentResponse> findByTeacherId(String teacherId);

    /**
     * Find a specific assignment by ID.
     */
    TeacherAssignmentResponse findById(String id);

    /**
     * Create a new teacher assignment.
     * Admin only.
     */
    TeacherAssignmentResponse create(TeacherAssignmentRequest request);

    /**
     * Update an existing assignment (dates, notes, class teacher status).
     * Admin only.
     */
    TeacherAssignmentResponse update(String id, TeacherAssignmentRequest request);

    /**
     * Delete an assignment (soft delete or hard delete).
     * Admin only.
     */
    void delete(String id);

    /**
     * Check if a teacher is assigned to teach a specific subject in a class.
     * Used for authorization checks.
     */
    boolean isTeacherAssignedToClassSubject(String teacherId, String classId, String subjectId);

    /**
     * Find all teachers assigned to a class-subject combo.
     * Used to find students' teachers.
     */
    List<TeacherAssignmentResponse> findByClassIdAndSubjectId(String classId, String subjectId);

    /**
     * Find all assignments for a class.
     * Used to list all teachers in a class.
     */
    List<TeacherAssignmentResponse> findByClassId(String classId);

    /**
     * Find active (date-qualified) assignments for a teacher with pagination.
     * If `date` is null, the current date is used.
     */
    List<TeacherAssignmentResponse> findActiveAssignmentsByTeacherAtDate(String teacherId, java.time.LocalDate date, int page, int size);
}
