package com.school.service;

import com.school.document.StudyMaterial;
import com.school.dto.request.StudyMaterialRequest;
import com.school.dto.response.StudyMaterialResponse;

import java.util.List;

public interface StudyMaterialService {
    List<StudyMaterialResponse> findByClass(String classId);
    StudyMaterialResponse create(StudyMaterialRequest request, String teacherId);
    void delete(String id);

    // Exposes the raw entity (rather than the response DTO) because the
    // download endpoint needs the stored file name / original file name,
    // which aren't part of the public response shape.
    StudyMaterial getOrThrow(String id);
}