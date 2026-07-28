package com.school.dto.response;

import com.school.document.MaterialType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyMaterialResponse {
    private String id;
    private String classId;
    private String subjectId;
    private String teacherId;
    private String title;
    private MaterialType type;
    private String originalFileName;
    private String externalUrl;
    private String downloadUrl; // populated for PDF only
    private Instant uploadedAt;
}