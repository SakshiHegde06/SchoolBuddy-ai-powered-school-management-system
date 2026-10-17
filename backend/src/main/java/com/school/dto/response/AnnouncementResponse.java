package com.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class AnnouncementResponse {

    private String id;

    private String title;

    private String message;

    private String priority;

    private List<String> audienceRoles;

    private List<String> audienceClassIds;

    private Instant createdAt;

    private Instant updatedAt;
}