package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

// Single collection for all four roles. Keeping auth in one place means
// JWT issuance and login logic doesn't need to branch per role — only
// role-specific profile data (name/contact/etc for teachers, students,
// parents) lives in their own collections, referenced via refId.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password; // BCrypt hash, never returned in responses

    private Role role;

    private String refId; // id of the Teacher/Student/Parent document, null for Admin

    @Builder.Default
    private boolean active = true;

    private Instant createdAt;

    private Instant updatedAt;
}