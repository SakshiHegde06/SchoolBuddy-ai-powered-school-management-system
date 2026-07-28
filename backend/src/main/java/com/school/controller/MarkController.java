package com.school.controller;

import com.school.dto.request.MarkRequest;
import com.school.dto.response.MarkResponse;
import com.school.security.CustomUserDetails;
import com.school.service.MarkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marks")
@RequiredArgsConstructor
public class MarkController {

    private final MarkService markService;

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public MarkResponse create(@Valid @RequestBody MarkRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return markService.create(request, principal.getUser().getRefId());
    }

    @GetMapping("/student/{studentId}")
    public List<MarkResponse> findByStudent(@PathVariable String studentId) {
        return markService.findByStudent(studentId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public MarkResponse update(@PathVariable String id, @Valid @RequestBody MarkRequest request) {
        return markService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        markService.delete(id);
    }
}