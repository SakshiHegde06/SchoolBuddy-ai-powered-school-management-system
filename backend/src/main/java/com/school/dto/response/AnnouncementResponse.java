
package com.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AnnouncementResponse {

    private String id;

    private String title;

    private String message;

    private String priority;

    private Instant createdAt;

    private Instant updatedAt;
}