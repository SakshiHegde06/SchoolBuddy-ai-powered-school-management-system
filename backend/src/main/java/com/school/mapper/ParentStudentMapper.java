package com.school.mapper;

import com.school.document.Parent;
import com.school.document.ParentStudent;
import com.school.document.SchoolClass;
import com.school.document.Student;
import com.school.dto.response.ParentStudentResponse;

/**
 * Mapper to convert ParentStudent entity to Response DTO.
 * This mapper enriches the link with parent, student, and class names.
 */
public class ParentStudentMapper {

    public static ParentStudentResponse toResponse(
            ParentStudent link,
            Parent parent,
            Student student,
            SchoolClass schoolClass) {

        return ParentStudentResponse.builder()
                .id(link.getId())
                .parentId(link.getParentId())
                .parentName(parent != null ? parent.getName() : "Unknown")
                .parentEmail(parent != null ? parent.getEmail() : null)
                .parentPhone(parent != null ? parent.getPhone() : null)
                .studentId(link.getStudentId())
                .studentName(student != null ? student.getName() : "Unknown")
                .studentClass(schoolClass != null ? schoolClass.getName() : "Unknown")
                .studentSection(schoolClass != null ? schoolClass.getSection() : null)
                .guardianType(link.getGuardianType())
                .isPrimary(link.isPrimary())
                .isPrimaryContact(link.isPrimaryContact())
                .linkedAt(link.getLinkedAt())
                .unlinkedAt(link.getUnlinkedAt())
                .notes(link.getNotes())
                .build();
    }

    /**
     * Overload without enrichment (use when names not needed)
     */
    public static ParentStudentResponse toResponse(ParentStudent link) {
        return ParentStudentResponse.builder()
                .id(link.getId())
                .parentId(link.getParentId())
                .studentId(link.getStudentId())
                .guardianType(link.getGuardianType())
                .isPrimary(link.isPrimary())
                .isPrimaryContact(link.isPrimaryContact())
                .linkedAt(link.getLinkedAt())
                .unlinkedAt(link.getUnlinkedAt())
                .notes(link.getNotes())
                .build();
    }
}
