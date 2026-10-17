package com.school.controller;

import com.school.dto.request.StudentRequest;
import com.school.dto.response.StudentResponse;
import com.school.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.school.security.AuthorizationService;
import com.school.security.CustomUserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final AuthorizationService authorizationService;

    @GetMapping
    public List<StudentResponse> findAll() {
        return studentService.findAll();
    }

    @GetMapping("/{id}")
    public StudentResponse findById(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!authorizationService.canViewStudent(principal, principalRef, role, id)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view this student");
        }

        return studentService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse create(@Valid @RequestBody StudentRequest request) {
        return studentService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public StudentResponse update(@PathVariable String id, @Valid @RequestBody StudentRequest request) {
        return studentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        studentService.delete(id);
    }
}