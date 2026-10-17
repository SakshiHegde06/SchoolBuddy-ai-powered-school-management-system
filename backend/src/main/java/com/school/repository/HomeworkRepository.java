package com.school.repository;

import com.school.document.Homework;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface HomeworkRepository extends MongoRepository<Homework, String> {
    List<Homework> findByClassId(String classId);
    List<Homework> findByTeacherId(String teacherId);
}