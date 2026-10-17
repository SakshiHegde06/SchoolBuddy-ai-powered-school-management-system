package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "announcements")
public class Announcement {

    @Id
    private String id;

    private String title;

    private String message;

    private String priority;

    // Empty/null = visible to everyone. Otherwise one or more of
    // TEACHER, STUDENT, PARENT (admins always see everything).
    @Builder.Default
    private List<String> audienceRoles = List.of();

    // Only meaningful when audienceRoles includes STUDENT and/or PARENT.
    // Empty/null = every class. Otherwise restricts to these classIds
    // (for a parent, "visible" means at least one linked child is in one of these classes).
    @Builder.Default
    private List<String> audienceClassIds = List.of();

    private Instant createdAt;

    private Instant updatedAt;
}