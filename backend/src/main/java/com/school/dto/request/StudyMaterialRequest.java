package com.school.dto.request;

import com.school.document.MaterialType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

// Bound via @ModelAttribute (multipart/form-data), not @RequestBody — a
// MultipartFile can't come in as JSON.
@Data
public class StudyMaterialRequest {

    @NotBlank
    private String classId;

    @NotBlank
    private String subjectId;

    @NotBlank
    private String title;

    @NotNull
    private MaterialType type;

    // Required when type == LINK.
    private String externalUrl;

    // Required when type == PDF.
    private MultipartFile file;
}