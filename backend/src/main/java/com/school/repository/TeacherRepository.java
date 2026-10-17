package com.school.repository;

import com.school.document.Teacher;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TeacherRepository extends MongoRepository<Teacher, String> {
    java.util.Optional<Teacher> findByUserId(String userId);
    java.util.Optional<Teacher> findByEmailIgnoreCase(String email);
}