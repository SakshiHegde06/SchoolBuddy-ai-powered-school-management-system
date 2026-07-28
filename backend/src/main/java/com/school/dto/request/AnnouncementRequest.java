package com.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AnnouncementRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    private String priority;
}