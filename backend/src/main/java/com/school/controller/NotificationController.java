package com.school.controller;

import com.school.dto.response.NotificationResponse;
import com.school.security.CustomUserDetails;
import com.school.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> list(@AuthenticationPrincipal CustomUserDetails principal) {
        if (principal == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(notificationService.listForUser(principal.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal CustomUserDetails principal) {
        long count = principal == null ? 0 : notificationService.unreadCount(principal.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NotificationResponse> markRead(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(notificationService.markRead(id, principal.getId()));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal CustomUserDetails principal) {
        notificationService.markAllRead(principal.getId());
        return ResponseEntity.noContent().build();
    }
}