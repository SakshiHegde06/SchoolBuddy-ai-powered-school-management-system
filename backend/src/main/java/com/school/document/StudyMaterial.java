package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "study_materials")
public class StudyMaterial {

    @Id
    private String id;

    private String classId;

    private String subjectId;

    private String teacherId;

    private String title;

    private MaterialType type;

    // Set when type == PDF: the name the file is stored under on disk.
    private String fileName;

    // Set when type == PDF: the original upload name, used for downloads.
    private String originalFileName;

    // Set when type == LINK.
    private String externalUrl;

    private Instant uploadedAt;
}