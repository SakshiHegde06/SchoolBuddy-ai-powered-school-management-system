package com.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubjectRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String code;

    private boolean practical;

    private int weeklyFrequency;
}