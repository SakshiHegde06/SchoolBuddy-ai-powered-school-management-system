package com.school.service;

import com.school.dto.request.ParentStudentRequest;
import com.school.dto.response.ParentStudentResponse;

import java.util.List;

public interface ParentStudentService {

    /**
     * Find all children of a parent.
     * Used to build: Parent Dashboard → My Children
     */
    List<ParentStudentResponse> findChildrenByParentId(String parentId);

    /**
     * Find all active (current) children of a parent.
     * Excludes historically unlinked children.
     */
    List<ParentStudentResponse> findActiveChildrenByParentId(String parentId);

    /**
     * Find all parents of a student.
     * Used to determine who can view this student's data.
     */
    List<ParentStudentResponse> findParentsByStudentId(String studentId);

    /**
     * Find all active parents of a student.
     * Excludes historically unlinked parents.
     */
    List<ParentStudentResponse> findActiveParentsByStudentId(String studentId);

    /**
     * Find a specific parent-student link by ID.
     */
    ParentStudentResponse findById(String id);

    /**
     * Create a new parent-student link.
     * Admin only.
     */
    ParentStudentResponse create(ParentStudentRequest request);

    /**
     * Update an existing link (guardian type, primary/contact status).
     * Admin only.
     */
    ParentStudentResponse update(String id, ParentStudentRequest request);

    /**
     * Delete a link (hard delete or soft delete by setting unlinkedAt).
     * Admin only.
     */
    void delete(String id);

    /**
     * Check if a parent is linked to a student (authorization check).
     * Used to enforce: "Can this parent view this student's data?"
     */
    boolean isParentLinkedToStudent(String parentId, String studentId);

    /**
     * Find the primary contact for a student.
     * Used for emergency notifications.
     */
    ParentStudentResponse findPrimaryContactByStudentId(String studentId);
}
