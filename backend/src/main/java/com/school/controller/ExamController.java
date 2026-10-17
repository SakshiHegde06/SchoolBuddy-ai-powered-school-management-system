package com.school.controller;

import com.school.dto.request.ExamRequest;
import com.school.dto.response.ExamResponse;
import com.school.service.ExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @GetMapping
    public List<ExamResponse> findByClass(@RequestParam String classId) {
        return examService.findByClassId(classId);
    }

    @GetMapping("/{id}")
    public ExamResponse findById(@PathVariable String id) {
        return examService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ExamResponse create(@Valid @RequestBody ExamRequest request) {
        return examService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ExamResponse update(@PathVariable String id, @Valid @RequestBody ExamRequest request) {
        return examService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        examService.delete(id);
    }
}