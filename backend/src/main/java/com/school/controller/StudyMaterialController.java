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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public StudyMaterialResponse create(@Valid @ModelAttribute StudyMaterialRequest request,
                                         @AuthenticationPrincipal CustomUserDetails principal) {
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
        studyMaterialService.delete(id);
    }
}