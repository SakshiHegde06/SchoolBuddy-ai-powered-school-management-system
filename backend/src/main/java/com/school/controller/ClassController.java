package com.school.controller;

import com.school.dto.request.ClassRequest;
import com.school.dto.response.ClassResponse;
import com.school.dto.response.StudentResponse;
import com.school.mapper.StudentMapper;
import com.school.repository.StudentRepository;
import com.school.service.ClassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {

    private final ClassService classService;
    private final StudentRepository studentRepository;

    @GetMapping
    public List<ClassResponse> findAll() {
        return classService.findAll();
    }

    @GetMapping("/{id}")
    public ClassResponse findById(@PathVariable String id) {
        return classService.findById(id);
    }

    @GetMapping("/{id}/students")
    public List<StudentResponse> findStudentsByClassId(@PathVariable String id) {
        return studentRepository.findByClassId(id)
                .stream()
                .map(StudentMapper::toResponse)
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ClassResponse create(@Valid @RequestBody ClassRequest request) {
        return classService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ClassResponse update(@PathVariable String id, @Valid @RequestBody ClassRequest request) {
        return classService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        classService.delete(id);
    }

    /**
     * Year-end promotion: moves every student currently in {fromClassId}
     * into {toClassId} (e.g. 8A -> 9A), without touching their historical
     * marks/attendance/remarks records, which stay linked to the old classId.
     */
    @PostMapping("/{fromClassId}/promote")
    @PreAuthorize("hasRole('ADMIN')")
    public java.util.Map<String, Object> promote(
            @PathVariable String fromClassId,
            @RequestBody java.util.Map<String, String> body) {
        String toClassId = body.get("toClassId");
        if (toClassId == null || toClassId.isBlank()) {
            throw new IllegalArgumentException("toClassId is required");
        }

        var students = studentRepository.findByClassId(fromClassId);
        students.forEach(s -> s.setClassId(toClassId));
        studentRepository.saveAll(students);

        return java.util.Map.of(
                "promotedCount", students.size(),
                "fromClassId", fromClassId,
                "toClassId", toClassId
        );
    }
}