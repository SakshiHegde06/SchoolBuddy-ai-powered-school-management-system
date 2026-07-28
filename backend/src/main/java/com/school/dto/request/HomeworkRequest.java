package com.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class HomeworkRequest {

    @NotBlank
    private String classId;

    @NotBlank
    private String subjectId;

    @NotBlank
    private String title;

    private String description;

    private List<String> attachmentUrls;

    @NotNull
    private LocalDate dueDate;
}