package com.school.repository;

import com.school.document.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface StudentRepository extends MongoRepository<Student, String> {
    List<Student> findByClassId(String classId);
    List<Student> findByClassIdIn(List<String> classIds);
    Page<Student> findByClassIdIn(List<String> classIds, Pageable pageable);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByClassIdAndRollNumber(String classId, String rollNumber);
    boolean existsByClassIdAndRollNumberAndIdNot(String classId, String rollNumber, String id);
}