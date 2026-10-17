package com.school.repository;

import com.school.document.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(String recipientUserId);

    long countByRecipientUserIdAndIsReadFalse(String recipientUserId);
}