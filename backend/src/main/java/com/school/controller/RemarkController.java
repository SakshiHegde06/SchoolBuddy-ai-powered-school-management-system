package com.school.controller;

import com.school.dto.request.RemarkRequest;
import com.school.dto.response.RemarkResponse;
import com.school.security.CustomUserDetails;
import com.school.service.RemarkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/remarks")
@RequiredArgsConstructor
public class RemarkController {

    private final RemarkService remarkService;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public RemarkResponse create(
            @Valid @RequestBody RemarkRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {

        String teacherId = principal.getUser().getRefId();

        return remarkService.create(request, teacherId);
    }

    @GetMapping("/student/{studentId}")
    public List<RemarkResponse> getByStudent(
            @PathVariable String studentId
    ) {

        return remarkService.getByStudent(studentId);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public void delete(@PathVariable String id) {

        remarkService.delete(id);
    }
}