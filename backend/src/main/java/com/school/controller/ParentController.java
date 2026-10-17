package com.school.controller;

import com.school.dto.request.ParentRequest;
import com.school.dto.response.ParentResponse;
import com.school.dto.response.StudentResponse;
import com.school.mapper.StudentMapper;
import com.school.repository.ParentStudentRepository;
import com.school.repository.StudentRepository;
import com.school.service.ParentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.school.security.AuthorizationService;
import com.school.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parents")
@RequiredArgsConstructor
public class ParentController {

    private final ParentService parentService;
    private final ParentStudentRepository parentStudentRepository;
    private final StudentRepository studentRepository;
    private final com.school.repository.ParentRepository parentRepository;
    private final AuthorizationService authorizationService;

    @GetMapping
    public ResponseEntity<List<ParentResponse>> getAllParents() {
        return ResponseEntity.ok(parentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParentResponse> getParentById(@PathVariable String id) {
        return ResponseEntity.ok(parentService.findById(id));
    }

    @GetMapping("/{id}/children")
    public List<StudentResponse> getChildren(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails principal) {
        // Only parent themselves or admin can call this
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!("ADMIN".equals(role) || (principalRef != null && principalRef.equals(id)))) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view this parent's children");
        }

        List<String> studentIds = new java.util.ArrayList<>(
                parentStudentRepository.findByParentIdAndUnlinkedAtIsNull(id)
                        .stream()
                        .map(link -> link.getStudentId())
                        .toList()
        );

        if (studentIds.isEmpty()) {
            parentRepository.findById(id).ifPresent(p -> {
                if (p.getChildrenIds() != null && !p.getChildrenIds().isEmpty()) {
                    studentIds.addAll(p.getChildrenIds());
                }
            });
        }

        if (studentIds.isEmpty()) {
            return List.of();
        }

        return studentRepository.findAll()
                .stream()
                .filter(student -> studentIds.contains(student.getId()))
                .map(StudentMapper::toResponse)
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParentResponse> createParent(@RequestBody ParentRequest request) {
        ParentResponse response = parentService.create(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParentResponse> updateParent(
            @PathVariable String id,
            @RequestBody ParentRequest request) {

        return ResponseEntity.ok(parentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteParent(@PathVariable String id) {
        parentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}