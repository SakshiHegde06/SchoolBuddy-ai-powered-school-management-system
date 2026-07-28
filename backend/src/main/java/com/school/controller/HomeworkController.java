package com.school.controller;

import com.school.dto.request.HomeworkRequest;
import com.school.dto.response.HomeworkResponse;
import com.school.security.CustomUserDetails;
import com.school.service.HomeworkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/homework")
@RequiredArgsConstructor
public class HomeworkController {

    private final HomeworkService homeworkService;

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public HomeworkResponse create(@Valid @RequestBody HomeworkRequest request,
                                    @AuthenticationPrincipal CustomUserDetails principal) {
        return homeworkService.create(request, principal.getUser().getRefId());
    }

    @GetMapping("/class/{classId}")
    public List<HomeworkResponse> findByClass(@PathVariable String classId) {
        return homeworkService.findByClass(classId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public HomeworkResponse update(@PathVariable String id, @Valid @RequestBody HomeworkRequest request) {
        return homeworkService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        homeworkService.delete(id);
    }
}