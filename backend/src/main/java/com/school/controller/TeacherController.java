package com.school.controller;

import com.school.document.TeacherAssignment;
import com.school.dto.response.TeacherAssignmentResponse;
import com.school.service.TeacherAssignmentService;
import com.school.dto.request.TeacherRequest;
import com.school.dto.response.StudentResponse;
import com.school.dto.response.TeacherResponse;
import com.school.mapper.StudentMapper;
import com.school.repository.StudentRepository;
import com.school.repository.TeacherAssignmentRepository;
import com.school.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;
    private final TeacherAssignmentService teacherAssignmentService;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentRepository studentRepository;

    @GetMapping
    public List<TeacherResponse> findAll() {
        return teacherService.findAll();
    }

    @GetMapping("/{id}")
    public TeacherResponse findById(@PathVariable String id) {
        return teacherService.findById(id);
    }

    @GetMapping("/{id}/classes")
    @PreAuthorize("hasRole('ADMIN') or (principal != null and principal.user != null and principal.user.refId == #id)")
    public List<TeacherAssignmentResponse> findAssignedClasses(@PathVariable String id,
                                                              @RequestParam(required = false) java.time.LocalDate date,
                                                              @RequestParam(defaultValue = "0") int page,
                                                              @RequestParam(defaultValue = "20") int size) {
        // Return active assignments if date provided or by default today's assignments, paged
        return teacherAssignmentService.findActiveAssignmentsByTeacherAtDate(id, date, page, size);
    }

    @GetMapping("/{id}/students")
    @PreAuthorize("hasRole('ADMIN') or (principal != null and principal.user != null and principal.user.refId == #id)")
    public List<StudentResponse> findAssignedStudents(@PathVariable String id,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "50") int size) {
        Set<String> classIds = teacherAssignmentRepository.findByTeacherId(id)
                .stream()
                .map(TeacherAssignment::getClassId)
                .collect(Collectors.toSet());

        if (classIds.isEmpty()) {
            return List.of();
        }

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(Math.max(0, page), Math.max(1, size));
        var studentPage = studentRepository.findByClassIdIn(classIds.stream().toList(), pageable);

        return studentPage.getContent()
                .stream()
                .map(StudentMapper::toResponse)
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TeacherResponse create(@Valid @RequestBody TeacherRequest request) {
        return teacherService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TeacherResponse update(@PathVariable String id, @Valid @RequestBody TeacherRequest request) {
        return teacherService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        teacherService.delete(id);
    }
}