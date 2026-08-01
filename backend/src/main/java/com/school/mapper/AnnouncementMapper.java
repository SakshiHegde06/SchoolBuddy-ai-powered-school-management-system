package com.school.mapper;

import com.school.document.Announcement;
import com.school.dto.response.AnnouncementResponse;

public class AnnouncementMapper {

    private AnnouncementMapper() {}

    public static AnnouncementResponse toResponse(Announcement announcement) {
        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .message(announcement.getMessage())
                .priority(announcement.getPriority())
                .createdAt(announcement.getCreatedAt())
                .updatedAt(announcement.getUpdatedAt())
                .build();
    }
}