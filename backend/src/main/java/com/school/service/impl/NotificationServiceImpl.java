package com.school.service.impl;

import com.school.document.Notification;
import com.school.dto.response.NotificationResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.repository.NotificationRepository;
import com.school.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public List<NotificationResponse> listForUser(String userId) {
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public long unreadCount(String userId) {
        return notificationRepository.countByRecipientUserIdAndIsReadFalse(userId);
    }

    @Override
    public NotificationResponse markRead(String id, String userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));

        if (!notification.getRecipientUserId().equals(userId)) {
            throw new ResourceNotFoundException("Notification not found: " + id);
        }

        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Override
    public void markAllRead(String userId) {
        List<Notification> unread = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    @Override
    public NotificationResponse notify(String recipientUserId, String title, String message, String type, String referenceId) {
        Notification notification = Notification.builder()
                .recipientUserId(recipientUserId)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        return toResponse(notificationRepository.save(notification));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .referenceId(n.getReferenceId())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}