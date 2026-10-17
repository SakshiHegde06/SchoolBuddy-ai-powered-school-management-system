package com.school.controller;

import com.school.dto.request.AcademicYearRequest;
import com.school.dto.response.AcademicYearResponse;
import com.school.service.AcademicYearService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academic-years")
@RequiredArgsConstructor
public class AcademicYearController {

    private final AcademicYearService academicYearService;

    @GetMapping
    public List<AcademicYearResponse> findAll() {
        return academicYearService.findAll();
    }

    @GetMapping("/{id}")
    public AcademicYearResponse findById(@PathVariable String id) {
        return academicYearService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public AcademicYearResponse create(@Valid @RequestBody AcademicYearRequest request) {
        return academicYearService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AcademicYearResponse update(@PathVariable String id, @Valid @RequestBody AcademicYearRequest request) {
        return academicYearService.update(id, request);
    }

    @PutMapping("/{id}/set-current")
    @PreAuthorize("hasRole('ADMIN')")
    public AcademicYearResponse setCurrent(@PathVariable String id) {
        return academicYearService.setCurrent(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        academicYearService.delete(id);
    }
}
