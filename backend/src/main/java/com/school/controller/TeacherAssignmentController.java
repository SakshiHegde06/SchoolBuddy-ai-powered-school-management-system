package com.school.controller;

import com.school.dto.request.TeacherAssignmentRequest;
import com.school.dto.response.TeacherAssignmentResponse;
import com.school.service.TeacherAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for managing teacher assignments to classes and subjects.
 *
 * Only ADMIN can create/update/delete assignments.
 * Other users can view assignments relevant to them.
 */
@RestController
@RequestMapping("/api/teacherAssignments")
@RequiredArgsConstructor
public class TeacherAssignmentController {

    private final TeacherAssignmentService teacherAssignmentService;

    /**
     * Get all assignments for a specific teacher.
     * Used by: Admin (view), Teacher (view own)
     *
     * Example: GET /api/teacherAssignments?teacherId=priya-123
     * Returns: List of classes and subjects this teacher is assigned to
     */
    @GetMapping
    public List<TeacherAssignmentResponse> findByTeacherId(@RequestParam String teacherId) {
        return teacherAssignmentService.findByTeacherId(teacherId);
    }

    /**
     * Get a specific assignment by ID.
     *
     * Example: GET /api/teacherAssignments/assign-789
     */
    @GetMapping("/{id}")
    public TeacherAssignmentResponse findById(@PathVariable String id) {
        return teacherAssignmentService.findById(id);
    }

    /**
     * Create a new teacher assignment.
     * Only ADMIN can create.
     *
     * Example: POST /api/teacherAssignments
     * Body:
     * {
     *   "teacherId": "priya-123",
     *   "classId": "8A",
     *   "subjectId": "science-456",
     *   "effectiveFrom": "2026-09-01",
     *   "effectiveTo": null,
     *   "isClassTeacher": false
     * }
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TeacherAssignmentResponse create(@Valid @RequestBody TeacherAssignmentRequest request) {
        return teacherAssignmentService.create(request);
    }

    /**
     * Update an existing assignment (dates, notes, class teacher status).
     * Only ADMIN can update.
     *
     * Example: PUT /api/teacherAssignments/assign-789
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TeacherAssignmentResponse update(
            @PathVariable String id,
            @Valid @RequestBody TeacherAssignmentRequest request) {
        return teacherAssignmentService.update(id, request);
    }

    /**
     * Delete an assignment.
     * Only ADMIN can delete.
     *
     * Example: DELETE /api/teacherAssignments/assign-789
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        teacherAssignmentService.delete(id);
    }

    /**
     * Get all assignments for a specific class.
     * Used to list all teachers in a class.
     *
     * Example: GET /api/teacherAssignments/byClass/8A
     */
    @GetMapping("/byClass/{classId}")
    public List<TeacherAssignmentResponse> findByClassId(@PathVariable String classId) {
        return teacherAssignmentService.findByClassId(classId);
    }

    /**
     * Get all assignments for a specific class-subject combo.
     * Used to find who teaches this subject in this class.
     *
     * Example: GET /api/teacherAssignments/byClassSubject?classId=8A&subjectId=science-456
     */
    @GetMapping("/byClassSubject")
    public List<TeacherAssignmentResponse> findByClassIdAndSubjectId(
            @RequestParam String classId,
            @RequestParam String subjectId) {
        return teacherAssignmentService.findByClassIdAndSubjectId(classId, subjectId);
    }
}
