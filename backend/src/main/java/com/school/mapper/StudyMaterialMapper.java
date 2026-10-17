package com.school.mapper;

import com.school.document.MaterialType;
import com.school.document.StudyMaterial;
import com.school.dto.response.StudyMaterialResponse;

public class StudyMaterialMapper {
    private StudyMaterialMapper() {}

    public static StudyMaterialResponse toResponse(StudyMaterial material) {
        return toResponse(material, null, null, null, null);
    }

    public static StudyMaterialResponse toResponse(StudyMaterial material,
                                                   String subjectName,
                                                   String className,
                                                   String teacherName,
                                                   Long fileSize) {
        if (material == null) return null;
        return StudyMaterialResponse.builder()
                .id(material.getId())
                .classId(material.getClassId())
                .className(className)
                .subjectId(material.getSubjectId())
                .subjectName(subjectName)
                .teacherId(material.getTeacherId())
                .teacherName(teacherName)
                .title(material.getTitle())
                .type(material.getType())
                .originalFileName(material.getOriginalFileName())
                .externalUrl(material.getExternalUrl())
                .downloadUrl(material.getType() == MaterialType.PDF
                        ? "/api/materials/" + material.getId() + "/download"
                        : null)
                .fileSize(fileSize)
                .uploadedAt(material.getUploadedAt())
                .build();
    }
}