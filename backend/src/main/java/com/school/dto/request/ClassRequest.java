package com.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class ClassRequest {

    @NotBlank
    private String name;

    private String section;

    private String academicYearId;

    private String classTeacherId;

    private List<String> subjectIds;
}