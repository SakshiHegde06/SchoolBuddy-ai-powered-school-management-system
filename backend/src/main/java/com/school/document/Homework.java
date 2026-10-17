package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "homework")
public class Homework {

    @Id
    private String id;

    private String classId;

    private String subjectId;

    private String teacherId;

    private String title;

    private String description;

    @Builder.Default
    private List<String> attachmentUrls = List.of();

    private LocalDate dueDate;

    private Instant createdAt;
}