package com.school.mapper;

import com.school.document.MaterialType;
import com.school.document.StudyMaterial;
import com.school.dto.response.StudyMaterialResponse;

public class StudyMaterialMapper {
    private StudyMaterialMapper() {}

    public static StudyMaterialResponse toResponse(StudyMaterial material) {
        if (material == null) return null;
        return StudyMaterialResponse.builder()
                .id(material.getId())
                .classId(material.getClassId())
                .subjectId(material.getSubjectId())
                .teacherId(material.getTeacherId())
                .title(material.getTitle())
                .type(material.getType())
                .originalFileName(material.getOriginalFileName())
                .externalUrl(material.getExternalUrl())
                .downloadUrl(material.getType() == MaterialType.PDF
                        ? "/api/materials/" + material.getId() + "/download"
                        : null)
                .uploadedAt(material.getUploadedAt())
                .build();
    }
}