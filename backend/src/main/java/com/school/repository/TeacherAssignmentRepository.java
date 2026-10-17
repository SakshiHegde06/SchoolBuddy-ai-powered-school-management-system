package com.school.repository;

import com.school.document.TeacherAssignment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TeacherAssignmentRepository extends MongoRepository<TeacherAssignment, String> {

    /**
     * Find all assignments for a teacher.
     * Used to build: "My Classes" dashboard for a teacher
     */
    List<TeacherAssignment> findByTeacherId(String teacherId);

    /**
     * Find all assignments for a teacher, filtered by effective dates (active only).
     * Optional: use this for current/active assignments only
     */
    @Query("{ 'teacherId': ?0, 'effectiveFrom': { $lte: ?1 }, $or: [ { 'effectiveTo': null }, { 'effectiveTo': { $gte: ?1 } } ] }")
    List<TeacherAssignment> findActiveAssignmentsByTeacherAtDate(String teacherId, LocalDate date);

    @Query("{ 'teacherId': ?0, 'effectiveFrom': { $lte: ?1 }, $or: [ { 'effectiveTo': null }, { 'effectiveTo': { $gte: ?1 } } ] }")
    org.springframework.data.domain.Page<TeacherAssignment> findActiveAssignmentsByTeacherAtDate(String teacherId, LocalDate date, org.springframework.data.domain.Pageable pageable);

    /**
     * Find all assignments for a specific teacher + class + subject combo.
     * Used to validate: "Is Teacher X assigned to teach Subject Y in Class Z?"
     */
    Optional<TeacherAssignment> findByTeacherIdAndClassIdAndSubjectId(String teacherId, String classId, String subjectId);

    /**
     * Find all teachers assigned to a specific class + subject.
     * Used to fetch students' teachers for a given subject
     */
    List<TeacherAssignment> findByClassIdAndSubjectId(String classId, String subjectId);

    /**
     * Find all assignments for a specific class.
     * Used to list all teachers teaching in a class
     */
    List<TeacherAssignment> findByClassId(String classId);

    /**
     * Find all assignments for a specific subject.
     * Used to list all teachers teaching a subject
     */
    List<TeacherAssignment> findBySubjectId(String subjectId);

    /**
     * Find the class teacher for a specific class.
     * Usually there's one primary class teacher per class
     */
    Optional<TeacherAssignment> findByClassIdAndClassTeacherTrue(String classId);

    /**
     * Check if teacher is assigned to a class-subject combo.
     * Used for authorization checks
     */
    boolean existsByTeacherIdAndClassIdAndSubjectId(String teacherId, String classId, String subjectId);
}
