package com.school.service.impl;

import com.school.document.MaterialType;
import com.school.document.StudyMaterial;
import com.school.dto.request.StudyMaterialRequest;
import com.school.dto.response.StudyMaterialResponse;
import com.school.exception.ApiException;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.StudyMaterialMapper;
import com.school.repository.StudyMaterialRepository;
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

    @Override
    public List<StudyMaterialResponse> findByClass(String classId) {
        return studyMaterialRepository.findByClassIdOrderByUploadedAtDesc(classId).stream()
                .map(StudyMaterialMapper::toResponse)
                .toList();
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
            if (!"application/pdf".equals(file.getContentType())) {
                throw new ApiException("Only PDF files are allowed.");
            }
            String storedFileName = fileStorageService.store(file);
            material.fileName(storedFileName).originalFileName(file.getOriginalFilename());
        } else {
            if (request.getExternalUrl() == null || request.getExternalUrl().isBlank()) {
                throw new ApiException("A link URL is required for material type LINK.");
            }
            material.externalUrl(request.getExternalUrl().trim());
        }

        return StudyMaterialMapper.toResponse(studyMaterialRepository.save(material.build()));
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
}