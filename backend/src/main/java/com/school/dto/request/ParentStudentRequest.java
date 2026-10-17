package com.school.dto.request;

import com.school.document.ParentStudent.GuardianType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request to link a parent to a student.
 *
 * Example:
 * {
 *   "parentId": "anitha-123",
 *   "studentId": "rahul-456",
 *   "guardianType": "MOTHER",
 *   "isPrimary": true,
 *   "isPrimaryContact": true
 * }
 */
@Data
public class ParentStudentRequest {

    @NotBlank
    private String parentId;

    @NotBlank
    private String studentId;

    @NotNull
    private GuardianType guardianType;

    // Is this the primary guardian?
    private boolean isPrimary;

    // Is this the primary contact (for emergency)?
    private boolean isPrimaryContact;

    // Optional notes about the guardianship
    private String notes;
}
