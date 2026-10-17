package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * A single notification for a single user (e.g. "Science FA1 marks published",
 * "New homework added"). Targeted at exactly one recipient via recipientUserId
 * — for a broadcast (announcement) each recipient gets their own row so
 * read/unread state is per-user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    // User.id of the recipient
    private String recipientUserId;

    private String title;

    private String message;

    // e.g. MARKS_PUBLISHED, HOMEWORK_POSTED, ATTENDANCE_ALERT, ANNOUNCEMENT, REMARK_ADDED
    private String type;

    // Optional id of the thing this notification is about (homeworkId, markId, etc.)
    private String referenceId;

    @Builder.Default
    private boolean isRead = false;

    private Instant createdAt;
}