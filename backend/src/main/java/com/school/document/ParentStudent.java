package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Formally establishes the relationship: Parent is a guardian of Student.
 *
 * This entity replaces the loose Parent.childrenIds[] and Student.parentIds[] arrays.
 * Now we can definitively answer: "Is Parent X linked to Student Y?" and with what role?
 *
 * Example:
 *   Anitha Sharma (Parent)
 *     ├── ParentStudent { parentId: "anitha", studentId: "rahul", guardianType: "MOTHER", isPrimary: true }
 *     └── ParentStudent { parentId: "anitha", studentId: "riya", guardianType: "MOTHER", isPrimary: true }
 *
 * This enables:
 *   - Parent dashboard: "Show me my children" → [Rahul, Riya]
 *   - Authorization: "Can Parent X see Student Y's data?" → YES
 *   - Contact priority: "Which parent to call first?" → isPrimaryContact
 *   - Audit trail: Track when parent was linked/unlinked
 *   - Legal compliance: Guardian type (mother, father, guardian, etc.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "parentStudents")
public class ParentStudent {

    @Id
    private String id;

    // The parent
    private String parentId;

    // The student
    private String studentId;

    // Guardian type: MOTHER, FATHER, GUARDIAN, OTHER
    private GuardianType guardianType;

    // Is this the primary guardian? (for legal/official purposes)
    private boolean primary;

    // Is this the primary contact? (for emergency/school communications)
    private boolean primaryContact;

    // When was this relationship established?
    private Instant linkedAt;

    public boolean isPrimary() {
        return primary;
    }

    public void setPrimary(boolean primary) {
        this.primary = primary;
    }

    public boolean isPrimaryContact() {
        return primaryContact;
    }

    public void setPrimaryContact(boolean primaryContact) {
        this.primaryContact = primaryContact;
    }

    // When was this relationship ended? (null = ongoing)
    private Instant unlinkedAt;

    // Optional notes about the guardianship
    private String notes;

    public enum GuardianType {
        MOTHER,
        FATHER,
        GUARDIAN,
        GRANDPARENT,
        OTHER
    }
}
