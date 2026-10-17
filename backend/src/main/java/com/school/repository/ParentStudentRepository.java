package com.school.repository;

import com.school.document.ParentStudent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ParentStudentRepository extends MongoRepository<ParentStudent, String> {

    /**
     * Find all children of a parent.
     * Used to populate: Parent Dashboard → My Children
     */
    List<ParentStudent> findByParentId(String parentId);

    /**
     * Find all parents of a student.
     * Used to find who can view this student's data
     */
    List<ParentStudent> findByStudentId(String studentId);

    /**
     * Find active (unlinked = null) children of a parent.
     * Used to show current children only
     */
    List<ParentStudent> findByParentIdAndUnlinkedAtIsNull(String parentId);

    /**
     * Find active (unlinked = null) parents of a student.
     * Used to find current guardians only
     */
    List<ParentStudent> findByStudentIdAndUnlinkedAtIsNull(String studentId);

    /**
     * Check if a parent is linked to a student.
     * Used for authorization: "Can this parent view this student's data?"
     */
    boolean existsByParentIdAndStudentIdAndUnlinkedAtIsNull(String parentId, String studentId);

    /**
     * Find the specific link between a parent and student.
     * Used to get guardian type and priority info
     */
    Optional<ParentStudent> findByParentIdAndStudentId(String parentId, String studentId);

    /**
     * Find primary contact for a student.
     * Used to determine who to call in case of emergency
     */
    Optional<ParentStudent> findByStudentIdAndPrimaryContactTrue(String studentId);

    /**
     * Find all active links for a student.
     * Used to display all guardians in admin interface
     */
    List<ParentStudent> findByStudentIdAndUnlinkedAtIsNullOrderByPrimaryDesc(String studentId);
}
