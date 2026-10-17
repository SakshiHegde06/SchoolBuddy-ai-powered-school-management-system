package com.school.controller;

import com.school.document.*;
import com.school.dto.response.SearchResultDto;
import com.school.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SearchController {

    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final ParentRepository parentRepository;
    private final ClassRepository classRepository;
    private final SubjectRepository subjectRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SearchResultDto>> search(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "All") String category) {

        String q = query != null ? query.trim().toLowerCase() : "";
        if (q.isBlank()) {
            return ResponseEntity.ok(List.of());
        }

        List<SearchResultDto> results = new ArrayList<>();
        boolean searchAll = "All".equalsIgnoreCase(category);

        // Preload class lookup map for student subtitles
        Map<String, String> classNameById = new HashMap<>();
        for (SchoolClass c : classRepository.findAll()) {
            String label = c.getName() + (c.getSection() != null && !c.getSection().isBlank() ? " (" + c.getSection() + ")" : "");
            classNameById.put(c.getId(), label);
        }

        // 1. Students
        if (searchAll || "Students".equalsIgnoreCase(category)) {
            for (Student s : studentRepository.findAll()) {
                if (matches(s.getName(), q) || matches(s.getEmail(), q) || matches(s.getRollNumber(), q) || matches(s.getAdmissionNumber(), q)) {
                    String cls = s.getClassId() != null ? classNameById.getOrDefault(s.getClassId(), "Class " + s.getClassId()) : "";
                    String roll = s.getRollNumber() != null ? "Roll #" + s.getRollNumber() : "";
                    String subtitle = Stream.of(cls, roll, s.getEmail())
                            .filter(val -> val != null && !val.isBlank())
                            .collect(Collectors.joining(" • "));

                    results.add(SearchResultDto.builder()
                            .id(s.getId())
                            .category("Students")
                            .title(s.getName())
                            .subtitle(subtitle)
                            .link("/admin/students")
                            .build());
                    if (results.size() >= 30) break;
                }
            }
        }

        // 2. Teachers
        if (searchAll || "Teachers".equalsIgnoreCase(category)) {
            for (Teacher t : teacherRepository.findAll()) {
                if (matches(t.getName(), q) || matches(t.getEmail(), q) || matches(t.getPhone(), q)) {
                    String subtitle = Stream.of(t.getEmail(), t.getPhone())
                            .filter(val -> val != null && !val.isBlank())
                            .collect(Collectors.joining(" • "));

                    results.add(SearchResultDto.builder()
                            .id(t.getId())
                            .category("Teachers")
                            .title(t.getName())
                            .subtitle(subtitle)
                            .link("/admin/teachers")
                            .build());
                    if (results.size() >= 45) break;
                }
            }
        }

        // 3. Classes
        if (searchAll || "Classes".equalsIgnoreCase(category)) {
            for (SchoolClass c : classRepository.findAll()) {
                if (matches(c.getName(), q) || matches(c.getSection(), q)) {
                    String title = c.getName() + (c.getSection() != null && !c.getSection().isBlank() ? " - Section " + c.getSection() : "");
                    String subtitle = c.getStudentCount() + " Students";

                    results.add(SearchResultDto.builder()
                            .id(c.getId())
                            .category("Classes")
                            .title(title)
                            .subtitle(subtitle)
                            .link("/admin/classes")
                            .build());
                    if (results.size() >= 55) break;
                }
            }
        }

        // 4. Subjects
        if (searchAll || "Subjects".equalsIgnoreCase(category)) {
            for (Subject sub : subjectRepository.findAll()) {
                if (matches(sub.getName(), q) || matches(sub.getCode(), q)) {
                    String title = sub.getName() + (sub.getCode() != null && !sub.getCode().isBlank() ? " (" + sub.getCode() + ")" : "");
                    String subtitle = sub.getWeeklyFrequency() + " periods/week" + (sub.isPractical() ? " • Lab" : "");

                    results.add(SearchResultDto.builder()
                            .id(sub.getId())
                            .category("Subjects")
                            .title(title)
                            .subtitle(subtitle)
                            .link("/admin/subjects")
                            .build());
                    if (results.size() >= 65) break;
                }
            }
        }

        // 5. Parents
        if (searchAll || "Parents".equalsIgnoreCase(category)) {
            for (Parent p : parentRepository.findAll()) {
                if (matches(p.getName(), q) || matches(p.getEmail(), q) || matches(p.getPhone(), q)) {
                    String subtitle = Stream.of(p.getEmail(), p.getPhone())
                            .filter(val -> val != null && !val.isBlank())
                            .collect(Collectors.joining(" • "));

                    results.add(SearchResultDto.builder()
                            .id(p.getId())
                            .category("Parents")
                            .title(p.getName())
                            .subtitle(subtitle)
                            .link("/admin/parents")
                            .build());
                    if (results.size() >= 75) break;
                }
            }
        }

        return ResponseEntity.ok(results);
    }

    private boolean matches(String value, String q) {
        return value != null && value.toLowerCase().contains(q);
    }
}
