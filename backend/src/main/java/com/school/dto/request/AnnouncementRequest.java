package com.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class AnnouncementRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    private String priority;

    private List<String> audienceRoles;

    private List<String> audienceClassIds;
}