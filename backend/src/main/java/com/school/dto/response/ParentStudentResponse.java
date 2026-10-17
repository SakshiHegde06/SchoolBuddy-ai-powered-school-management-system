package com.school.dto.response;

import com.school.document.ParentStudent.GuardianType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response containing a parent-student link with enriched details.
 *
 * Example:
 * {
 *   "id": "link-789",
 *   "parentId": "anitha-123",
 *   "parentName": "Anitha Sharma",
 *   "parentEmail": "anitha@email.com",
 *   "parentPhone": "9876543210",
 *   "studentId": "rahul-456",
 *   "studentName": "Rahul Sharma",
 *   "studentClass": "8A",
 *   "guardianType": "MOTHER",
 *   "isPrimary": true,
 *   "isPrimaryContact": true,
 *   "linkedAt": "2026-01-15T10:30:00Z",
 *   "unlinkedAt": null
 * }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParentStudentResponse {

    private String id;

    private String parentId;

    private String parentName;

    private String parentEmail;

    private String parentPhone;

    private String studentId;

    private String studentName;

    private String studentClass;

    private String studentSection;

    private GuardianType guardianType;

    private boolean isPrimary;

    private boolean isPrimaryContact;

    private Instant linkedAt;

    private Instant unlinkedAt;

    private String notes;
}
