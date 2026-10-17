package com.school.controller;

import com.school.document.StudyMaterial;
import com.school.dto.request.StudyMaterialRequest;
import com.school.dto.response.StudyMaterialResponse;
import com.school.security.CustomUserDetails;
import com.school.service.FileStorageService;
import com.school.service.StudyMaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class StudyMaterialController {

    private final StudyMaterialService studyMaterialService;
    private final FileStorageService fileStorageService;
    private final com.school.service.TeacherAssignmentService teacherAssignmentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public StudyMaterialResponse create(@Valid @ModelAttribute StudyMaterialRequest request,
                                         @AuthenticationPrincipal CustomUserDetails principal) {
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!"ADMIN".equals(role)) {
            if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, request.getClassId(), request.getSubjectId())) {
                throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
            }
        }

        return studyMaterialService.create(request, principal.getUser().getRefId());
    }

    // Any authenticated role can view — students, teachers, and admins all
    // need to see what's posted for a class.
    @GetMapping("/class/{classId}")
    public List<StudyMaterialResponse> findByClass(@PathVariable String classId) {
        return studyMaterialService.findByClass(classId);
    }

    // Streams the PDF bytes through an authenticated endpoint (rather than a
    // static/public file URL) so the JWT filter still guards access.
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable String id) {
        StudyMaterial material = studyMaterialService.getOrThrow(id);
        Resource resource = fileStorageService.loadAsResource(material.getFileName());
        String filename = material.getOriginalFileName() != null
                ? material.getOriginalFileName()
                : material.getFileName();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        // Only admin or teacher assigned to the material's class+subject may delete
        StudyMaterial material = studyMaterialService.getOrThrow(id);
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails principal = null;
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) principal = (CustomUserDetails) auth.getPrincipal();
        String principalRef = principal != null ? principal.getUser().getRefId() : null;
        String role = principal != null ? principal.getUser().getRole().name() : null;

        if (!"ADMIN".equals(role)) {
            if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, material.getClassId(), material.getSubjectId())) {
                throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class/subject");
            }
        }

        studyMaterialService.delete(id);
    }
}