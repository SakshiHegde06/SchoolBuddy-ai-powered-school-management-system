package com.school.service.impl;

import com.school.document.MaterialType;
import com.school.document.StudyMaterial;
import com.school.document.SchoolClass;
import com.school.document.Subject;
import com.school.document.Teacher;
import com.school.dto.request.StudyMaterialRequest;
import com.school.dto.response.StudyMaterialResponse;
import com.school.exception.ApiException;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.StudyMaterialMapper;
import com.school.repository.ClassRepository;
import com.school.repository.StudyMaterialRepository;
import com.school.repository.SubjectRepository;
import com.school.repository.TeacherRepository;
import com.school.service.FileStorageService;
import com.school.service.StudyMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudyMaterialServiceImpl implements StudyMaterialService {

    private final StudyMaterialRepository studyMaterialRepository;
    private final FileStorageService fileStorageService;
    private final SubjectRepository subjectRepository;
    private final ClassRepository classRepository;
    private final TeacherRepository teacherRepository;

    @Override
    public List<StudyMaterialResponse> findByClass(String classId) {
        return studyMaterialRepository.findByClassIdOrderByUploadedAtDesc(classId).stream()
                .map(this::enrich)
                .toList();
    }

    @Override
    public List<StudyMaterialResponse> findAll() {
        return studyMaterialRepository.findAll().stream()
                .sorted((a, b) -> {
                    if (a.getUploadedAt() == null && b.getUploadedAt() == null) return 0;
                    if (a.getUploadedAt() == null) return 1;
                    if (b.getUploadedAt() == null) return -1;
                    return b.getUploadedAt().compareTo(a.getUploadedAt());
                })
                .map(this::enrich)
                .toList();
    }

    @Override
    public StudyMaterialResponse getResponseById(String id) {
        StudyMaterial material = getOrThrow(id);
        return enrich(material);
    }

    @Override
    public StudyMaterialResponse create(StudyMaterialRequest request, String teacherId) {
        StudyMaterial.StudyMaterialBuilder material = StudyMaterial.builder()
                .classId(request.getClassId())
                .subjectId(request.getSubjectId())
                .teacherId(teacherId)
                .title(request.getTitle())
                .type(request.getType())
                .uploadedAt(Instant.now());

        if (request.getType() == MaterialType.PDF) {
            MultipartFile file = request.getFile();
            if (file == null || file.isEmpty()) {
                throw new ApiException("A PDF file is required for material type PDF.");
            }
            boolean isPdf = (file.getContentType() != null && file.getContentType().toLowerCase().contains("pdf"))
                    || (file.getOriginalFilename() != null && file.getOriginalFilename().toLowerCase().endsWith(".pdf"));
            if (!isPdf) {
                throw new IllegalArgumentException("Only PDF files are allowed.");
            }
            String storedFileName = fileStorageService.store(file);
            material.fileName(storedFileName).originalFileName(file.getOriginalFilename());
        } else {
            if (request.getExternalUrl() == null || request.getExternalUrl().isBlank()) {
                throw new ApiException("A link URL is required for material type LINK.");
            }
            material.externalUrl(request.getExternalUrl().trim());
        }

        StudyMaterial saved = studyMaterialRepository.save(material.build());
        return enrich(saved);
    }

    @Override
    public void delete(String id) {
        StudyMaterial material = getOrThrow(id);
        if (material.getType() == MaterialType.PDF && material.getFileName() != null) {
            fileStorageService.delete(material.getFileName());
        }
        studyMaterialRepository.delete(material);
    }

    @Override
    public StudyMaterial getOrThrow(String id) {
        return studyMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Study material not found: " + id));
    }

    private StudyMaterialResponse enrich(StudyMaterial material) {
        String subjectName = null;
        if (material.getSubjectId() != null) {
            subjectName = subjectRepository.findById(material.getSubjectId())
                    .map(Subject::getName)
                    .orElse(null);
        }

        String className = null;
        if (material.getClassId() != null) {
            className = classRepository.findById(material.getClassId())
                    .map(c -> c.getName() + (c.getSection() != null && !c.getSection().isBlank() ? " " + c.getSection() : ""))
                    .orElse(null);
        }

        String teacherName = null;
        if (material.getTeacherId() != null) {
            teacherName = teacherRepository.findById(material.getTeacherId())
                    .map(Teacher::getName)
                    .orElse(null);
        }

        Long fileSize = null;
        if (material.getType() == MaterialType.PDF && material.getFileName() != null) {
            try {
                var res = fileStorageService.loadAsResource(material.getFileName());
                if (res.exists()) {
                    fileSize = res.contentLength();
                }
            } catch (Exception ignored) {
            }
        }

        return StudyMaterialMapper.toResponse(material, subjectName, className, teacherName, fileSize);
    }
}