package com.school.service;

import com.school.dto.response.NotificationResponse;

import java.util.List;

public interface NotificationService {

    /** All notifications for the given user, most recent first. */
    List<NotificationResponse> listForUser(String userId);

    /** How many unread notifications the given user has. */
    long unreadCount(String userId);

    NotificationResponse markRead(String id, String userId);

    void markAllRead(String userId);

    /**
     * Create a notification for one recipient. Used internally by other
     * services (marks published, homework posted, attendance alert, etc.)
     * rather than exposed for arbitrary creation by the frontend.
     */
    NotificationResponse notify(String recipientUserId, String title, String message, String type, String referenceId);
}