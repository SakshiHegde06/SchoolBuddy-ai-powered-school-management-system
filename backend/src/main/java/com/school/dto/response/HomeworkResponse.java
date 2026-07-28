package com.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeworkResponse {
    private String id;
    private String classId;
    private String subjectId;
    private String teacherId;
    private String title;
    private String description;
    private List<String> attachmentUrls;
    private LocalDate dueDate;
    private Instant createdAt;
}