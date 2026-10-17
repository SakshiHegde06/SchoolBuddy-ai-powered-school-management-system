package com.school.controller;

import com.school.document.MaterialType;
import com.school.document.Student;
import com.school.document.StudyMaterial;
import com.school.document.Subject;
import com.school.dto.ai.AiTutorRequest;
import com.school.dto.ai.AiTutorResponse;
import com.school.dto.request.StudyMaterialRequest;
import com.school.dto.response.StudyMaterialResponse;
import com.school.repository.ClassRepository;
import com.school.repository.StudentRepository;
import com.school.repository.SubjectRepository;
import com.school.security.CustomUserDetails;
import com.school.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class StudyMaterialController {

    private final StudyMaterialService studyMaterialService;
    private final FileStorageService fileStorageService;
    private final TeacherAssignmentService teacherAssignmentService;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final ClassRepository classRepository;
    private final PdfStudyNotesGenerator pdfStudyNotesGenerator;
    private final AiTutorService aiTutorService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public StudyMaterialResponse create(@Valid @ModelAttribute StudyMaterialRequest request,
                                         @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null && principal.getUser() != null ? principal.getUser().getRefId() : null;
        String role = principal != null && principal.getUser() != null && principal.getUser().getRole() != null
                ? principal.getUser().getRole().name() : null;

        if (!"ADMIN".equals(role)) {
            if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, request.getClassId(), request.getSubjectId())) {
                throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
            }
        }

        return studyMaterialService.create(request, principalRef);
    }

    /**
     * Lists materials with optional class or subject filters.
     * If a student calls without classId, attempts to resolve their assigned class automatically.
     */
    @GetMapping
    public List<StudyMaterialResponse> list(@RequestParam(required = false) String classId,
                                            @RequestParam(required = false) String subjectId,
                                            @AuthenticationPrincipal CustomUserDetails principal) {
        if (classId != null && !classId.isBlank()) {
            List<StudyMaterialResponse> list = studyMaterialService.findByClass(classId);
            if (subjectId != null && !subjectId.isBlank()) {
                return list.stream().filter(m -> subjectId.equals(m.getSubjectId())).toList();
            }
            return list;
        }

        // Auto-resolve class for student
        if (principal != null && principal.getUser() != null) {
            String role = principal.getUser().getRole().name();
            String refId = principal.getUser().getRefId();
            if ("STUDENT".equals(role) && refId != null) {
                Student s = studentRepository.findById(refId).orElse(null);
                if (s != null && s.getClassId() != null) {
                    List<StudyMaterialResponse> list = studyMaterialService.findByClass(s.getClassId());
                    if (subjectId != null && !subjectId.isBlank()) {
                        return list.stream().filter(m -> subjectId.equals(m.getSubjectId())).toList();
                    }
                    return list;
                }
            }
        }

        List<StudyMaterialResponse> all = studyMaterialService.findAll();
        if (subjectId != null && !subjectId.isBlank()) {
            return all.stream().filter(m -> subjectId.equals(m.getSubjectId())).toList();
        }
        return all;
    }

    @GetMapping("/class/{classId}")
    public List<StudyMaterialResponse> findByClass(@PathVariable String classId) {
        return studyMaterialService.findByClass(classId);
    }

    @GetMapping("/{id}")
    public StudyMaterialResponse getById(@PathVariable String id) {
        return studyMaterialService.getResponseById(id);
    }

    /**
     * Downloads or previews the PDF material.
     * Supports ?disposition=attachment or ?disposition=inline (default inline).
     * If the physical file is missing from disk, dynamically produces a formatted study notes PDF.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable String id,
                                             @RequestParam(required = false, defaultValue = "inline") String disposition) {
        StudyMaterial material = studyMaterialService.getOrThrow(id);

        if (material.getType() == MaterialType.LINK) {
            if (material.getExternalUrl() != null && !material.getExternalUrl().isBlank()) {
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(material.getExternalUrl()))
                        .build();
            }
        }

        String filename = material.getOriginalFileName() != null && !material.getOriginalFileName().isBlank()
                ? material.getOriginalFileName()
                : (material.getTitle() != null ? material.getTitle().replaceAll("[^a-zA-Z0-9.-]", "_") + ".pdf" : "study_material.pdf");

        if (!filename.toLowerCase().endsWith(".pdf")) {
            filename += ".pdf";
        }

        Resource resource = null;
        if (material.getFileName() != null && !material.getFileName().isBlank()) {
            try {
                Resource diskResource = fileStorageService.loadAsResource(material.getFileName());
                if (diskResource.exists() && diskResource.isReadable()) {
                    resource = diskResource;
                }
            } catch (Exception ignored) {
            }
        }

        // If file not found on disk, generate a high-yield study notes PDF on-the-fly
        if (resource == null) {
            String subjectName = material.getSubjectId() != null
                    ? subjectRepository.findById(material.getSubjectId()).map(Subject::getName).orElse("General Studies")
                    : "General Studies";
            String className = material.getClassId() != null
                    ? classRepository.findById(material.getClassId()).map(c -> c.getName() + " " + (c.getSection() != null ? c.getSection() : "")).orElse("All Classes")
                    : "All Classes";

            byte[] pdfBytes = pdfStudyNotesGenerator.generateStudyNotesPdf(material, subjectName, className);
            resource = new ByteArrayResource(pdfBytes);
        }

        String dispositionHeader = "attachment".equalsIgnoreCase(disposition)
                ? "attachment; filename=\"" + filename + "\""
                : "inline; filename=\"" + filename + "\"";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, dispositionHeader)
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(resource);
    }

    /**
     * AI Tutor endpoint for a specific study material.
     * Generates Important Topics, MCQs, 5M Questions, 10M Questions, or Interactive Tutoring Chat.
     */
    @PostMapping("/{id}/ai-tutor")
    public AiTutorResponse getAiTutorForMaterial(@PathVariable String id,
                                                 @RequestBody(required = false) AiTutorRequest request) {
        if (request == null) {
            request = new AiTutorRequest();
        }
        return aiTutorService.getTutorResponseForMaterial(id, request);
    }

    /**
     * AI Tutor endpoint for general academic topics or doubts.
     */
    @PostMapping("/ai-tutor")
    public AiTutorResponse getGeneralAiTutor(@RequestBody AiTutorRequest request) {
        return aiTutorService.getTutorResponse(request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        StudyMaterial material = studyMaterialService.getOrThrow(id);
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails principal = null;
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) principal = (CustomUserDetails) auth.getPrincipal();
        String principalRef = principal != null && principal.getUser() != null ? principal.getUser().getRefId() : null;
        String role = principal != null && principal.getUser() != null && principal.getUser().getRole() != null
                ? principal.getUser().getRole().name() : null;

        if (!"ADMIN".equals(role)) {
            if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, material.getClassId(), material.getSubjectId())) {
                throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
            }
        }

        studyMaterialService.delete(id);
    }
}