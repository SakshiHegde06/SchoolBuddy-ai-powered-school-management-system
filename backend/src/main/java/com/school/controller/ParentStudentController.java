package com.school.controller;

import com.school.dto.request.ParentStudentRequest;
import com.school.dto.response.ParentStudentResponse;
import com.school.service.ParentStudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.school.security.CustomUserDetails;
import com.school.security.AuthorizationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for managing parent-student relationships.
 *
 * Only ADMIN can create/update/delete links.
 * Parents and students can view their own relationships.
 */
@RestController
@RequestMapping("/api/parentStudents")
@RequiredArgsConstructor
public class ParentStudentController {

    private final ParentStudentService parentStudentService;
    private final AuthorizationService authorizationService;

    /**
     * Get all children of a parent (including historical).
     * Used by: Admin (view all), Parent (view own)
     *
     * Example: GET /api/parentStudents/childrenByParent?parentId=anitha-123
     * Returns: All children linked to this parent
     */
    @GetMapping("/childrenByParent")
    public List<ParentStudentResponse> findChildrenByParentId(@RequestParam String parentId, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!"ADMIN".equals(role) && !(principalRef != null && principalRef.equals(parentId))) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view these children");
        }

        return parentStudentService.findChildrenByParentId(parentId);
    }

    /**
     * Get all active (current) children of a parent.
     * Excludes historically unlinked children.
     *
     * Example: GET /api/parentStudents/activeChildrenByParent?parentId=anitha-123
     * Returns: Only current children
     */
    @GetMapping("/activeChildrenByParent")
    public List<ParentStudentResponse> findActiveChildrenByParentId(@RequestParam String parentId, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!"ADMIN".equals(role) && !(principalRef != null && principalRef.equals(parentId))) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view these children");
        }

        return parentStudentService.findActiveChildrenByParentId(parentId);
    }

    /**
     * Get all parents of a student (including historical).
     * Used by: Admin (view), Student (view own guardians)
     *
     * Example: GET /api/parentStudents/parentsByStudent?studentId=rahul-456
     * Returns: All parents/guardians linked to this student
     */
    @GetMapping("/parentsByStudent")
    public List<ParentStudentResponse> findParentsByStudentId(@RequestParam String studentId, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!authorizationService.canViewStudent(principal, principalRef, role, studentId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view parents for this student");
        }

        return parentStudentService.findParentsByStudentId(studentId);
    }

    /**
     * Get all active (current) parents of a student.
     * Excludes historically unlinked parents.
     *
     * Example: GET /api/parentStudents/activeParentsByStudent?studentId=rahul-456
     * Returns: Only current guardians
     */
    @GetMapping("/activeParentsByStudent")
    public List<ParentStudentResponse> findActiveParentsByStudentId(@RequestParam String studentId, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!authorizationService.canViewStudent(principal, principalRef, role, studentId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view parents for this student");
        }

        return parentStudentService.findActiveParentsByStudentId(studentId);
    }

    /**
     * Get a specific parent-student link by ID.
     *
     * Example: GET /api/parentStudents/link-789
     */
    @GetMapping("/{id}")
    public ParentStudentResponse findById(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails principal) {
        ParentStudentResponse resp = parentStudentService.findById(id);
        String studentId = resp.getStudentId();
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!authorizationService.canViewStudent(principal, principalRef, role, studentId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view this link");
        }

        return resp;
    }

    /**
     * Create a new parent-student link.
     * Only ADMIN can create.
     *
     * Example: POST /api/parentStudents
     * Body:
     * {
     *   "parentId": "anitha-123",
     *   "studentId": "rahul-456",
     *   "guardianType": "MOTHER",
     *   "isPrimary": true,
     *   "isPrimaryContact": true
     * }
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ParentStudentResponse create(@Valid @RequestBody ParentStudentRequest request) {
        return parentStudentService.create(request);
    }

    /**
     * Update an existing parent-student link (guardian type, primary/contact status).
     * Only ADMIN can update.
     *
     * Example: PUT /api/parentStudents/link-789
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ParentStudentResponse update(
            @PathVariable String id,
            @Valid @RequestBody ParentStudentRequest request) {
        return parentStudentService.update(id, request);
    }

    /**
     * Delete (unlink) a parent-student relationship.
     * Only ADMIN can delete.
     * Note: This performs a soft delete (marks unlinkedAt timestamp).
     *
     * Example: DELETE /api/parentStudents/link-789
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        parentStudentService.delete(id);
    }

    /**
     * Get the primary contact for a student.
     * Used for emergency notifications.
     *
     * Example: GET /api/parentStudents/primaryContact?studentId=rahul-456
     * Returns: The parent marked as primary contact
     */
    @GetMapping("/primaryContact")
    public ParentStudentResponse findPrimaryContactByStudentId(@RequestParam String studentId, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!authorizationService.canViewStudent(principal, principalRef, role, studentId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view primary contact");
        }

        return parentStudentService.findPrimaryContactByStudentId(studentId);
    }
}
